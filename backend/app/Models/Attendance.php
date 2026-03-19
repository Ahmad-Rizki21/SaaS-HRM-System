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
        'image_in', 'image_out',
        'status'
    ];

    protected $appends = ['date', 'check_in_time', 'check_out_time', 'check_in_location'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getDateAttribute()
    {
        return $this->check_in ? \Carbon\Carbon::parse($this->check_in)->format('Y-m-d') : null;
    }

    public function getCheckInTimeAttribute()
    {
        return $this->check_in ? \Carbon\Carbon::parse($this->check_in)->format('H:i:s') : null;
    }

    public function getCheckOutTimeAttribute()
    {
        return $this->check_out ? \Carbon\Carbon::parse($this->check_out)->format('H:i:s') : null;
    }

    public function getCheckInLocationAttribute()
    {
        if ($this->latitude_in && $this->longitude_in) {
            return $this->latitude_in . ', ' . $this->longitude_in;
        }
        return 'Sistem Web';
    }
}
