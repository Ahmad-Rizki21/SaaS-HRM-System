<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Holiday extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'date'];
}
