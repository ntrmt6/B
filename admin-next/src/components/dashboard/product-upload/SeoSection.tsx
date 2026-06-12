import React from 'react';
import { Section, InputField } from './ui';
import { SectionFormProps } from './types';

const SeoSection: React.FC<SectionFormProps> = ({ formData, updateField }) => {
  return (
    <Section title="SEO Info">
      <div className="space-y-4">
        <InputField
          label="Keyword"
          value={formData.keywords}
          onChange={(v) => updateField('keywords', v)}
          placeholder="Seo Keyword"
        />
        <InputField
          label="SEO Description"
          value={formData.seoDescription}
          onChange={(v) => updateField('seoDescription', v)}
          placeholder="Seo Description"
        />
        <InputField
          label="SEO Title"
          value={formData.seoTitle}
          onChange={(v) => updateField('seoTitle', v)}
          placeholder="Seo Title"
        />
      </div>
    </Section>
  );
};

export default React.memo(SeoSection);
