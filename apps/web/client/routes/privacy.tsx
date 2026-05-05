import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "../components/public-footer";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase text-muted-foreground">Book Cook</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated May 4, 2026</p>

        <div className="mt-10 space-y-9 leading-7 text-muted-foreground">
          <Section title="Overview">
            Book Cook helps people research, plan, draft, edit, export, and package books. This
            policy explains what information we collect, how we use it, and the choices you have
            when you use the service.
          </Section>

          <Section title="Information We Collect">
            We collect account information you provide, such as your email address, name, sign-in
            method, and authentication data. We also store the projects, concepts, outlines,
            chapters, manuscript text, author voices, research prompts, export settings, and launch
            materials you create in the app.
          </Section>

          <Section title="How We Use Information">
            We use information to operate Book Cook, save your work, generate outlines and drafts,
            run Scout research, prepare exports, protect the service, debug issues, and improve app
            reliability. We may use aggregated or de-identified usage data to understand product
            performance.
          </Section>

          <Section title="AI Processing">
            When you ask Book Cook to research, draft, revise, review, or export content, your
            prompts, project context, and selected manuscript content may be sent to AI providers or
            infrastructure services needed to complete the request. We send only the context needed
            for the feature you use.
          </Section>

          <Section title="Service Providers">
            We use infrastructure, database, storage, authentication, analytics, observability, AI,
            and export-processing providers to run the service. These providers process information
            for us under their own security and privacy obligations.
          </Section>

          <Section title="Retention and Deletion">
            We keep account and project information while your account is active or as needed to
            provide the service, meet legal obligations, resolve disputes, prevent abuse, and keep
            backups. You can delete project content from the app where deletion controls are
            available.
          </Section>

          <Section title="Security">
            We use practical technical and organizational safeguards to protect information, but no
            internet service can guarantee absolute security. Keep your account credentials secure
            and contact us if you believe your account has been compromised.
          </Section>

          <Section title="Children">
            Book Cook is not intended for children under 13, and we do not knowingly collect
            personal information from children under 13.
          </Section>

          <Section title="Changes">
            We may update this policy as Book Cook changes. When we make material updates, we will
            revise the date above and provide notice when appropriate.
          </Section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}
