<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Announcement extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'user_id', 'title', 'content'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
