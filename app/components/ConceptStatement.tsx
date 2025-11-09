interface ConceptStatementProps {
  statement: string;
}

export default function ConceptStatement({ statement }: ConceptStatementProps) {
  return (
    <section className="h-screen flex items-center justify-center px-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-3xl mx-auto">
        <p 
          className="font-serif text-2xl md:text-3xl lg:text-4xl text-center leading-relaxed text-foreground"
          data-testid="text-concept-statement"
        >
          {statement}
        </p>
      </div>
    </section>
  );
}
