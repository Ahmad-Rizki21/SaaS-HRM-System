<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Shift extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'start_time', 'end_time'];

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
