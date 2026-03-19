<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'month',
        'year',
        'basic_salary',
        'allowance',
        'deduction',
        'net_salary',
        'status',
        'details'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
