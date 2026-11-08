<?php

namespace Tests\Unit;

use App\Services\OpenAIService;
use RuntimeException;
use Tests\TestCase;

class OpenAIServiceTest extends TestCase
{
    public function test_generate_script_throws_when_openai_is_not_configured(): void
    {
        config()->set('services.openai.key', null);

        $service = new OpenAIService();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI is not configured. Set OPENAI_API_KEY to generate scripts.');

        $service->generateScript([
            [
                'id' => 1,
                'title' => 'Test article',
                'content' => 'Test content',
            ],
        ]);
    }

    public function test_regenerate_segment_throws_when_openai_is_not_configured(): void
    {
        config()->set('services.openai.key', null);

        $service = new OpenAIService();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI is not configured. Set OPENAI_API_KEY to regenerate segments.');

        $service->regenerateSegment(
            'body',
            'Current segment text',
            [
                [
                    'type' => 'body',
                    'script_text' => 'Current segment text',
                ],
            ],
            [
                [
                    'title' => 'Test article',
                    'content' => 'Test content',
                ],
            ]
        );
    }

    public function test_generate_image_throws_when_openai_is_not_configured(): void
    {
        config()->set('services.openai.key', null);

        $service = new OpenAIService();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI is not configured. Set OPENAI_API_KEY to generate images.');

        $service->generateImage('Prompt text');
    }
}
