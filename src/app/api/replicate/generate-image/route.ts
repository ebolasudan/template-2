import { NextResponse } from "next/server";
import Replicate from "replicate";
import { withErrorHandler } from "@/lib/api/error-handler";
import { ImageGenerationRequest, ImageGenerationResponse } from "@/types/api";
import { ValidationError, ConfigurationError, AuthenticationError, ExternalServiceError } from "@/lib/errors";
import { getServerSession } from "@/lib/auth/session";

export const POST = withErrorHandler(async (request: Request) => {
  // Check authentication
  const session = await getServerSession(request);
  if (!session) {
    throw new AuthenticationError();
  }

  // Validate API token
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new ConfigurationError(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  // Parse and validate request body
  const body = await request.json() as Partial<ImageGenerationRequest>;
  
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    throw new ValidationError('Prompt is required and must be a non-empty string');
  }

  // Validate optional parameters
  if (body.width && (body.width < 128 || body.width > 1024 || body.width % 64 !== 0)) {
    throw new ValidationError('Width must be between 128 and 1024 and divisible by 64');
  }

  if (body.height && (body.height < 128 || body.height > 1024 || body.height % 64 !== 0)) {
    throw new ValidationError('Height must be between 128 and 1024 and divisible by 64');
  }

  if (body.num_inference_steps && (body.num_inference_steps < 1 || body.num_inference_steps > 500)) {
    throw new ValidationError('Number of inference steps must be between 1 and 500');
  }

  if (body.guidance_scale && (body.guidance_scale < 1 || body.guidance_scale > 20)) {
    throw new ValidationError('Guidance scale must be between 1 and 20');
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: body.prompt,
          negative_prompt: body.negative_prompt,
          width: body.width || 512,
          height: body.height || 512,
          num_outputs: body.num_samples || 1,
          num_inference_steps: body.num_inference_steps || 50,
          guidance_scale: body.guidance_scale || 7.5,
          scheduler: "DPMSolverMultistep",
          seed: body.seed,
        },
      }
    );

    // Format response
    const response: ImageGenerationResponse = {
      id: crypto.randomUUID(),
      images: Array.isArray(output) ? output as string[] : [output as string],
      status: 'succeeded',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new ConfigurationError('Invalid Replicate API token');
      }
      if (error.message.includes('422')) {
        throw new ValidationError('Invalid parameters for image generation');
      }
      throw new ExternalServiceError('Replicate', error);
    }
    throw error;
  }
}, { path: '/api/replicate/generate-image' });