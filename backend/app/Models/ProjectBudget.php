<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectBudget extends Model
{
    protected $fillable = [
        'project_id', 'category', 'item_name', 'unit', 'volume', 'unit_price', 'total_price', 'notes'
    ];

    protected $casts = [
        'volume' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function costs()
    {
        return $this->hasMany(ProjectCost::class, 'budget_item_id');
    }

    protected static function booted()
    {
        static::saving(function ($budget) {
            $budget->total_price = $budget->volume * $budget->unit_price;
        });
    }
}
