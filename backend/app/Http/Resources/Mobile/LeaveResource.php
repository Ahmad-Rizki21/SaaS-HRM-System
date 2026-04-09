<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class LeaveResource extends JsonResource
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
            'type' => $this->type,
            'status' => $this->status,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'duration' => Carbon::parse($this->start_date)->diffInDays(Carbon::parse($this->end_date)) + 1,
            'reason' => $this->reason,
            'date_requested' => $this->created_at->format('d M Y'),
        ];
    }
}
