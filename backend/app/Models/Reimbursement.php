<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Reimbursement extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id', 'user_id', 'title', 'amount', 
        'description', 'status', 'approved_by', 'attachment', 'remark'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
