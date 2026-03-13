import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BatteryGauge } from './BatteryGauge'

describe('BatteryGauge', () => {
  it('renders percentage text', () => {
    render(<BatteryGauge percent={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('has accessible label for screen readers', () => {
    render(<BatteryGauge percent={75} />)
    expect(screen.getByLabelText(/battery 75%/i)).toBeInTheDocument()
  })

  it('clamps values above 100 to 100', () => {
    render(<BatteryGauge percent={150} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByLabelText(/battery 100%/i)).toBeInTheDocument()
  })

  it('clamps values below 0 to 0', () => {
    render(<BatteryGauge percent={-10} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByLabelText(/battery 0%/i)).toBeInTheDocument()
  })

  it('rounds decimal percentage for display', () => {
    render(<BatteryGauge percent={33.7} />)
    expect(screen.getByText('34%')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<BatteryGauge percent={50} className="custom-class" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('renders SVG circle elements', () => {
    const { container } = render(<BatteryGauge percent={50} />)
    const circles = container.querySelectorAll('svg circle')
    expect(circles.length).toBeGreaterThanOrEqual(2)
  })

  it('matches snapshot at 50%', () => {
    const { container } = render(<BatteryGauge percent={50} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
