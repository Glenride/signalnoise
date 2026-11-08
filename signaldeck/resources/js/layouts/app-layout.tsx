import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { LayoutGrid } from 'lucide-react';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} title="The Signal" url="/dashboard" icon={LayoutGrid} {...props}>
        {children}
    </AppLayoutTemplate>
);
