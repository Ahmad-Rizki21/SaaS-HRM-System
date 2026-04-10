import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from './page'

describe('LoginPage', () => {
  it('renders login title', () => {
    render(<LoginPage />)
    expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument()
  })

  it('renders login subtitle', () => {
    render(<LoginPage />)
    expect(screen.getByText(/ON TIME HRMS/i)).toBeInTheDocument()
  })
})
