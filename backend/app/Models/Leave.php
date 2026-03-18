<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class Leave extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'user_id', 'company_id', 'start_date', 'end_date',
        'type', 'reason', 'status', 'approved_by', 'signature', 'remark'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
