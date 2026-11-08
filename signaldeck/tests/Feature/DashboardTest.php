<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('users only see their own feeds on the dashboard', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $userFeed = \App\Models\Feed::create([
        'user_id' => $user->id,
        'name' => 'My Secret Feed',
        'url' => 'http://example.com/feed.xml',
        'category' => 'tech',
        'is_active' => true,
    ]);

    $otherUserFeed = \App\Models\Feed::create([
        'user_id' => $otherUser->id,
        'name' => 'Other Persons Feed',
        'url' => 'http://example.org/feed.xml',
        'category' => 'finance',
        'is_active' => true,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertSee('My Secret Feed');
    $response->assertDontSee('Other Persons Feed');
});