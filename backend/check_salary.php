<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Salary;

$user = User::where('email', 'staff@example.com')->first();
if ($user) {
    $salaries = Salary::where('user_id', $user->id)->get();
    echo "Total: " . $salaries->count() . "\n";
    echo json_encode($salaries, JSON_PRETTY_PRINT);
} else {
    echo "User not found";
}
