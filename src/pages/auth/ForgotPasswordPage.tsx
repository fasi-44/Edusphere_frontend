/**
 * Forgot Password Page
 * Two-step process: Request password reset, then reset with token
 */

import PageMeta from '../../components/common/PageMeta';
import AuthLayout from '../AuthPages/AuthPageLayout';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <>
      <PageMeta
        title="Forgot Password | Edusphere"
        description="Reset your password"
      />
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
