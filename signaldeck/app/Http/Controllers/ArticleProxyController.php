<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ArticleProxyController extends Controller
{
    /**
     * Fetch an external article page server-side and return extracted content as JSON
     * or the full proxied HTML, depending on the 'mode' param.
     */
    public function show(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        $url = $request->input('url');
        $mode = $request->input('mode', 'extract'); // 'extract' or 'full'

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Referer' => 'https://www.google.com/',
            ])->timeout(15)->get($url);

            if (! $response->successful()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Source returned status ' . $response->status(),
                ], 200); // Return 200 so frontend handles gracefully
            }

            $html = $response->body();

            if ($mode === 'full') {
                // Return full proxied HTML (existing behaviour)
                $parsed = parse_url($url);
                $origin = $parsed['scheme'] . '://' . $parsed['host'];
                $html = preg_replace(
                    '/<head([^>]*)>/i',
                    '<head$1><base href="' . $origin . '/">',
                    $html,
                    1
                );
                return response($html)
                    ->header('Content-Type', 'text/html; charset=UTF-8')
                    ->header('X-Frame-Options', 'SAMEORIGIN');
            }

            // Extract mode: pull article content from HTML
            $extracted = $this->extractArticle($html, $url);

            return response()->json([
                'success' => true,
                'title' => $extracted['title'],
                'content' => $extracted['content'],
                'image' => $extracted['image'],
                'author' => $extracted['author'],
                'source' => parse_url($url, PHP_URL_HOST),
                'url' => $url,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Extract article content from raw HTML using meta tags and DOM parsing.
     */
    private function extractArticle(string $html, string $url): array
    {
        $result = [
            'title' => '',
            'content' => '',
            'image' => '',
            'author' => '',
        ];

        // Strip all <style> blocks from the raw HTML before DOM parsing
        // This prevents inline CSS from leaking into textContent
        $html = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $html);

        // Suppress DOM parsing warnings
        libxml_use_internal_errors(true);
        $doc = new \DOMDocument();
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);

        // ── Title ──────────────────────────────────────────
        // Try og:title first, then <title>
        $ogTitle = $this->getMeta($xpath, 'og:title');
        if ($ogTitle) {
            $result['title'] = $ogTitle;
        } else {
            $titleNodes = $doc->getElementsByTagName('title');
            if ($titleNodes->length > 0) {
                $result['title'] = trim($titleNodes->item(0)->textContent);
            }
        }

        // ── Image ──────────────────────────────────────────
        $result['image'] = $this->getMeta($xpath, 'og:image') ?? '';

        // ── Author ─────────────────────────────────────────
        $result['author'] = $this->getMeta($xpath, 'author')
            ?? $this->getMetaName($xpath, 'author')
            ?? '';

        // ── Content extraction ─────────────────────────────
        // Strategy: try <article> tag first, then common content selectors
        $contentSelectors = [
            '//article',
            '//*[contains(@class,"article-body")]',
            '//*[contains(@class,"article__body")]',
            '//*[contains(@class,"article-content")]',
            '//*[contains(@class,"story-body")]',
            '//*[contains(@class,"post-content")]',
            '//*[contains(@class,"entry-content")]',
            '//*[contains(@class,"content-body")]',
            '//*[@id="article-body"]',
            '//*[@id="story-body"]',
            '//*[@itemprop="articleBody"]',
            '//main',
        ];

        foreach ($contentSelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $node = $nodes->item(0);
                $result['content'] = $this->extractTextContent($node, $doc);
                if (strlen(strip_tags($result['content'])) > 200) {
                    break; // Good enough content found
                }
            }
        }

        // Fallback: grab all <p> tags from body
        if (strlen(strip_tags($result['content'])) < 200) {
            $paragraphs = $xpath->query('//body//p');
            $texts = [];
            if ($paragraphs) {
                foreach ($paragraphs as $p) {
                    $text = trim($p->textContent);
                    if (strlen($text) > 40) { // Skip short nav/footer text
                        $texts[] = '<p>' . htmlspecialchars($text) . '</p>';
                    }
                }
            }
            if (count($texts) > 0) {
                $result['content'] = implode("\n", $texts);
            }
        }

        return $result;
    }

    /**
     * Extract clean HTML content from a DOM node, keeping paragraphs and headings.
     */
    private function extractTextContent(\DOMNode $node, \DOMDocument $doc): string
    {
        // Remove script, style, nav, aside, footer, header elements
        $removeTags = ['script', 'style', 'nav', 'aside', 'footer', 'header', 'form', 'iframe', 'svg', 'figure', 'noscript'];
        foreach ($removeTags as $tag) {
            $elements = $node->getElementsByTagName($tag);
            $toRemove = [];
            foreach ($elements as $el) {
                $toRemove[] = $el;
            }
            foreach ($toRemove as $el) {
                if ($el->parentNode) {
                    $el->parentNode->removeChild($el);
                }
            }
        }

        // Also remove elements with common non-content classes
        $xpath = new \DOMXPath($doc);
        $noiseSelectors = [
            './/*[contains(@class,"ad-")]',
            './/*[contains(@class,"social")]',
            './/*[contains(@class,"share")]',
            './/*[contains(@class,"newsletter")]',
            './/*[contains(@class,"related")]',
            './/*[contains(@class,"sidebar")]',
            './/*[contains(@class,"comment")]',
            './/*[contains(@class,"nav")]',
            './/*[contains(@class,"footer")]',
            './/*[contains(@class,"promo")]',
        ];

        foreach ($noiseSelectors as $selector) {
            $noiseNodes = $xpath->query($selector, $node);
            if ($noiseNodes) {
                $toRemove = [];
                foreach ($noiseNodes as $n) {
                    $toRemove[] = $n;
                }
                foreach ($toRemove as $n) {
                    if ($n->parentNode) {
                        $n->parentNode->removeChild($n);
                    }
                }
            }
        }

        // Get paragraphs and headings
        $output = [];
        $allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'];
        foreach ($allowedTags as $tag) {
            $elements = $node->getElementsByTagName($tag);
            foreach ($elements as $el) {
                $text = trim($el->textContent);

                // Clean any remaining CSS artifacts from the text
                $text = $this->cleanCssArtifacts($text);
                $text = trim($text);

                // Skip short fragments (except headings)
                if (strlen($text) <= 20 && !in_array($tag, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])) {
                    continue;
                }

                $output[] = '<' . $tag . '>' . htmlspecialchars($text) . '</' . $tag . '>';
            }
        }

        if (count($output) > 0) {
            return implode("\n", $output);
        }

        // Final fallback: just text content
        $text = trim($node->textContent);
        return '<p>' . nl2br(htmlspecialchars($text)) . '</p>';
    }

    /**
     * Strip CSS artifact substrings from extracted text.
     * MarketWatch and similar sites embed CSS declarations as text nodes
     * adjacent to real article content within the same DOM elements.
     */
    private function cleanCssArtifacts(string $text): string
    {
        // Remove CSS class/rule blocks: .css-8459s-OverridedLink{...}
        $text = preg_replace('/\.css-[a-z0-9_-]+[^.]*?\}[.}]*/si', '', $text);

        // Remove any remaining {...} CSS blocks
        $text = preg_replace('/\{[^}]*(?:text-decoration|border-bottom|font-size|font-weight|font-family|color|fill|display|margin|padding|background)[^}]*\}/si', '', $text);

        // Remove standalone CSS property fragments
        $text = preg_replace('/(?:-webkit-)?text-decoration\s*:\s*none;?/i', '', $text);
        $text = preg_replace('/border-bottom\s*:[^;.]+;?/i', '', $text);
        $text = preg_replace('/color\s*:\s*var\([^)]+\);?/i', '', $text);
        $text = preg_replace('/fill\s*:\s*var\([^)]+\);?/i', '', $text);

        // Remove @media queries that leaked
        $text = preg_replace('/@media\s*\([^)]*\)\s*\{[^}]*\}/si', '', $text);

        // Collapse multiple spaces
        $text = preg_replace('/\s{2,}/', ' ', $text);

        return $text;
    }

    /**
     * Get an Open Graph or other property meta tag value.
     */
    private function getMeta(\DOMXPath $xpath, string $property): ?string
    {
        $node = $xpath->query("//meta[@property='{$property}']/@content");
        if ($node && $node->length > 0) {
            return trim($node->item(0)->nodeValue);
        }
        return null;
    }

    /**
     * Get a meta tag value by name attribute.
     */
    private function getMetaName(\DOMXPath $xpath, string $name): ?string
    {
        $node = $xpath->query("//meta[@name='{$name}']/@content");
        if ($node && $node->length > 0) {
            return trim($node->item(0)->nodeValue);
        }
        return null;
    }
}
