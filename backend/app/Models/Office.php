<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class Office extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'latitude', 'longitude', 'radius'];
}
