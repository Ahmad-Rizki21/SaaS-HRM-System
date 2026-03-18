<?php

namespace App\Http\Controllers;

abstract class Controller
{
    public function successResponse($data, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function errorResponse($message, $code = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], $code);
    }

    protected function logActivity($action, $description, $model = null)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) return; // Skip if no user session (e.g. before login)

        \App\Models\ActivityLog::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model ? $model->id : null,
        ]);
    }
}
