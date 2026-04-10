<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_a_user_with_role_can_check_permission()
    {
        $company = \App\Models\Company::create(['name' => 'Test Co']);
        $role = Role::create(['name' => 'Test Admin']);
        $permission = Permission::create(['name' => 'View Test', 'slug' => 'view-test', 'group' => 'Test']);
        
        $role->permissions()->attach($permission->id);
        
        $user = User::factory()->create([
            'role_id' => $role->id,
            'company_id' => $company->id
        ]);

        $this->assertTrue($user->hasPermission('view-test'));
    }
}
