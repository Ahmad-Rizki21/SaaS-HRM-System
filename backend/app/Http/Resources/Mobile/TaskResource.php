<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority ?? 'medium',
            'due_date' => $this->due_date ? Carbon::parse($this->due_date)->format('Y-m-d') : null,
            'creator_name' => $this->creator->name ?? 'System',
        ];
    }
}
