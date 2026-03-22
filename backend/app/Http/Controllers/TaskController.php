<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::with('assigner')
            ->where('user_id', $request->user()->id)
            ->where('company_id', $request->user()->company_id)
            ->orderBy('deadline', 'asc')
            ->paginate(10);

        return $this->successResponse($tasks, 'Data tugas berhasil diambil.');
    }

    public function updateStatus(Request $request, $id)
    {
        $task = Task::where('user_id', $request->user()->id)->findOrFail($id);
        
        $request->validate(['status' => 'required|in:pending,ongoing,completed,cancelled']);
        
        $task->update(['status' => $request->status]);
        
        return $this->successResponse($task, 'Status tugas berhasil diperbarui.');
    }
}
