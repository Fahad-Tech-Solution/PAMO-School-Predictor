import { PredictorForm } from "@/components/predictor/predictor-form";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function PredictorPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">School Predictor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare an anonymous candidate profile to similar historical
          applications and review outcome evidence by school.
        </p>
      </div>

      <PredictorForm />
    </div>
  );
}
