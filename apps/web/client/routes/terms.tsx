import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "../components/public-footer";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase text-muted-foreground">Book Cook</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated May 4, 2026</p>

        <div className="mt-10 space-y-9 leading-7 text-muted-foreground">
          <Section title="Using Book Cook">
            Book Cook provides tools for book research, outlining, drafting, editing, review,
            export, and publishing preparation. By using the service, you agree to use it lawfully
            and in accordance with these terms.
          </Section>

          <Section title="Accounts">
            You are responsible for your account, credentials, and activity under your account. Use
            accurate information, keep your sign-in method secure, and notify us if you believe your
            account has been accessed without permission.
          </Section>

          <Section title="Your Content">
            You retain ownership of the manuscripts, outlines, author voices, prompts, research
            notes, exports, and other content you create or upload. You grant Book Cook the
            permission needed to host, process, generate, transform, display, and export that
            content so the service can work for you.
          </Section>

          <Section title="AI Output">
            AI-generated research, outlines, drafts, reviews, metadata, and export materials may be
            inaccurate, incomplete, or similar to content generated for others. You are responsible
            for reviewing output, confirming rights, checking facts, and deciding whether generated
            material is suitable for publication.
          </Section>

          <Section title="Acceptable Use">
            Do not use Book Cook to violate the law, infringe intellectual property rights, upload
            malware, scrape or attack the service, bypass usage limits, interfere with other users,
            or generate content that you are not allowed to create or distribute.
          </Section>

          <Section title="Exports and Publishing">
            Book Cook may help package PDF, EPUB, audio-ready, metadata, launch, or publisher
            handoff materials. You are responsible for reviewing exported files, meeting platform
            requirements, securing permissions, and complying with publisher or marketplace rules.
          </Section>

          <Section title="Service Changes">
            We may change, suspend, or discontinue parts of Book Cook as the product evolves. We may
            also limit or remove access when needed to protect the service, comply with legal
            obligations, or address misuse.
          </Section>

          <Section title="Disclaimers">
            Book Cook is provided as is and as available. To the fullest extent allowed by law, we
            disclaim warranties of merchantability, fitness for a particular purpose, non-
            infringement, and uninterrupted or error-free operation.
          </Section>

          <Section title="Limitation of Liability">
            To the fullest extent allowed by law, Book Cook will not be liable for indirect,
            incidental, special, consequential, exemplary, or punitive damages, or for lost profits,
            revenues, data, goodwill, or publishing opportunities.
          </Section>

          <Section title="Changes">
            We may update these terms as Book Cook changes. Continued use of the service after the
            updated terms take effect means you accept the revised terms.
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
