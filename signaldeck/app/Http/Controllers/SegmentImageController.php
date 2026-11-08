<?php

namespace App\Http\Controllers;

use App\Models\Segment;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use RuntimeException;

class SegmentImageController extends Controller
{
    protected $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->openAIService = $openAIService;
    }

    public function generate(Request $request)
    {
        $request->validate([
            'segment_id' => 'required|exists:segments,id',
            'prompt' => 'sometimes|string|nullable',
        ]);

        $segment = Segment::findOrFail($request->segment_id);

        // Use provided prompt, or fall back to visual_cue, or fall back to script_text
        $prompt = $request->input('prompt') 
            ?? $segment->visual_cue 
            ?? $segment->script_text;

        // Truncate if too long (though DALL-E 3 handles long prompts well)
        $prompt = substr($prompt, 0, 1000);

        try {
            $imageUrl = $this->openAIService->generateImage($prompt);
        } catch (RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 503);
        }

        $segment->update(['image_url' => $imageUrl]);

        return response()->json([
            'success' => true,
            'image_url' => $imageUrl,
            'message' => 'Image generated successfully'
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'segment_id' => 'required|exists:segments,id',
            'image' => 'required|image|max:10240',
        ]);

        $segment = Segment::findOrFail($request->segment_id);

        $path = $request->file('image')->store('segment-images', 'public');
        $imageUrl = '/storage/' . $path;

        $segment->update(['image_url' => $imageUrl]);

        return response()->json([
            'success' => true,
            'image_url' => $imageUrl,
        ]);
    }

    public function setUrl(Request $request)
    {
        $request->validate([
            'segment_id' => 'required|exists:segments,id',
            'image_url' => 'required|url|max:2048',
        ]);

        $segment = Segment::findOrFail($request->segment_id);
        $segment->update(['image_url' => $request->input('image_url')]);

        return response()->json([
            'success' => true,
            'image_url' => $segment->image_url,
        ]);
    }

    public function remove(Request $request)
    {
        $request->validate([
            'segment_id' => 'required|exists:segments,id',
        ]);

        $segment = Segment::findOrFail($request->segment_id);
        $segment->update(['image_url' => null]);

        return response()->json(['success' => true]);
    }
}
