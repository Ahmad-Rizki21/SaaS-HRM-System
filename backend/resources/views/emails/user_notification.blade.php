<x-mail::message>
# {{ $title }}

Halo **{{ $user->name }}**,

{{ $message }}

<x-mail::button :url="config('app.url') . '/dashboard'">
Buka Dashboard
</x-mail::button>

Terima kasih,<br>
**HRMS Narwastu Arthatama**
</x-mail::message>
