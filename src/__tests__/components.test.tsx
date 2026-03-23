// =============================================
// UI COMPONENTS — Render Tests
// =============================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, Badge, Card } from '@/components/ui';

// =============================================
// BUTTON
// =============================================

describe('Button', () => {
    it('renders with text content', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('renders primary variant with gradient class', () => {
        render(<Button variant="primary">Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-gradient');
    });

    it('renders ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-transparent');
    });

    it('renders danger variant', () => {
        render(<Button variant="danger">Delete</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('from-red-500');
    });

    it('applies disabled attribute', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
        render(<Button loading>Loading</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(btn.className).toContain('opacity');
    });

    it('applies size classes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button').className).toContain('px-3.5');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button').className).toContain('px-7');
    });
});

// =============================================
// BADGE
// =============================================

describe('Badge', () => {
    it('renders with text content', () => {
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders success variant with green color', () => {
        render(<Badge variant="success">Có mặt</Badge>);
        const badge = screen.getByText('Có mặt');
        expect(badge.className).toContain('emerald');
    });

    it('renders warning variant with yellow color', () => {
        render(<Badge variant="warning">Có phép</Badge>);
        const badge = screen.getByText('Có phép');
        expect(badge.className).toContain('yellow');
    });

    it('renders danger variant with red color', () => {
        render(<Badge variant="danger">Vắng</Badge>);
        const badge = screen.getByText('Vắng');
        expect(badge.className).toContain('red');
    });

    it('renders default variant', () => {
        render(<Badge>Default</Badge>);
        expect(screen.getByText('Default')).toBeInTheDocument();
    });
});

// =============================================
// CARD
// =============================================

describe('Card', () => {
    it('renders children', () => {
        render(<Card><p>Card Content</p></Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders glass variant', () => {
        render(<Card variant="glass"><p>Glass</p></Card>);
        const card = screen.getByText('Glass').parentElement!;
        expect(card.className).toContain('glass');
    });

    it('renders stat variant with accent bar', () => {
        render(<Card variant="stat"><p>Stat</p></Card>);
        const card = screen.getByText('Stat').parentElement!;
        expect(card.className).toContain('bg-[var(--bg-card)]');
    });

    it('applies custom className', () => {
        render(<Card className="custom-class"><p>Custom</p></Card>);
        const card = screen.getByText('Custom').parentElement!;
        expect(card.className).toContain('custom-class');
    });
});
