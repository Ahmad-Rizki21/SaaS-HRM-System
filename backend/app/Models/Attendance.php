<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class Attendance extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'user_id', 'company_id', 'office_id',
        'check_in', 'check_out',
        'latitude_in', 'longitude_in',
        'latitude_out', 'longitude_out',
        'status'
    ];
}
