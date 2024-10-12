"use client";

import { Button } from "@/components/ui-components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "@/components/ui-components/checkbox";
import { Divider } from "@/components/ui-components/divider";
import { Description, Field, Label } from "@/components/ui-components/fieldset";
import { Heading, Subheading } from "@/components/ui-components/heading";
import { Input } from "@/components/ui-components/input";
import {
  Radio,
  RadioField,
  RadioGroup,
} from "@/components/ui-components/radio";
import { Strong, Text } from "@/components/ui-components/text";
import { Textarea } from "@/components/ui-components/textarea";
import Image from "next/image";
import React, { useRef } from "react";

export default function Content() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <form className="mx-auto max-w-4xl p-3 pt-8 sm:px-4">
      <Heading level={1}>Post a job</Heading>
      <Divider className="my-10 mt-6" />
      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Company Logo</Subheading>
          <Text>Square format is best</Text>
        </div>
        <Field>
          <div className="flex items-center space-x-4">
            <Image
              src="https://s3-alpha-sig.figma.com/img/8a23/cb6a/8d462a922529d9ae7a44772fb9f64b61?Expires=1729468800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=XnJwSdtoT2ZlVsJvhBPWF3AAxyOJ5qVcunVwoDqMLar78R6wuZUJvkxS3VqeOFued9~gWF8biRwIdWhSA4NHF9Fiw5P5S-KFzs68QXDGLYVL7AhoEA2u-GYaEYep52BRmsQWceF8Bd9IDPYceJkF7MyIQCIkJFkuZ6FvXcHa319yBMk0xS4qGux2sNiBqxXOjA9gcraKuBh~mj3bEQ9l4GrqzBeHRt1s6OaBqbIJUSic984Wfizmfyjcu7NDLxJaTVsYVhe8d5p2Sv8QVCrvc0UspSGLYpsmJjybLF41zoEEkIxSb~iX905tpAo2q757TKSTDOinzLdCcUwCJ-VZ8Q__"
              width={80}
              height={80}
              alt="Company Logo"
              className="rounded-[10px]"
            />
            <div>
              <Button
                color="dark/white"
                className="mt-3 rounded-md"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                Change Logo
              </Button>
              <Input
                type="file"
                id="file-input"
                name="company-logo"
                accept="image/png, image/gif, image/jpeg"
                onChange={() => {}}
                className="hidden"
                ref={fileInputRef}
              />
              <Text className="mt-1 text-xs text-gray-500">
                JPG, GIF or PNG. 1MB max.
              </Text>
            </div>
          </div>
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Company Name</Subheading>
          <Text>This will be shown in the format you type it</Text>
        </div>
        <Field>
          <Input
            id="company-name"
            type="text"
            placeholder="Pixel Pulse Studios"
            autoComplete="given-company-name"
          />
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Job Title</Subheading>
          <Text>The job title for the position that you are opening</Text>
        </div>
        <Field>
          <Input
            id="job-title"
            type="text"
            placeholder="Reality Architect"
            autoComplete="given-job-title"
          />
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Job Description</Subheading>
          <Text>In markdown format</Text>
        </div>
        <Field>
          <Textarea
            id="job-description"
            placeholder="As a Reality Architect, you'll be at the forefront of creating immersive mixed reality experiences that blur the line between the digital and physical..."
            resizable={false}
            rows={3}
          />
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Locations</Subheading>
          <Text>
            Where is the job location? (“Dublin”, “Remote USA”, “Anywhere”).
          </Text>
        </div>
        <Field>
          <Input placeholder="Dublin (2 days in the office per week)" />
          <CheckboxGroup className="mt-3">
            <CheckboxField>
              <Checkbox name="remote" value="is_remote" />
              <Label>Work is remote</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox name="relocation" value="is_relocation_package" />
              <Label>Relocation package given</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox name="visa" value="is_visa_sponsored" />
              <Label>Visa sponsorship provided</Label>
            </CheckboxField>
          </CheckboxGroup>
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Application form URL</Subheading>
          <Text>A link to your website (optional)</Text>
        </div>
        <Field>
          <Input
            id="app-url"
            type="text"
            autoComplete="url"
            placeholder="https://example.com"
          />
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Job Type</Subheading>
          <Text>Full-time, part-time or freelancer</Text>
        </div>
        <Field>
          <RadioGroup defaultValue="full_time">
            <RadioField>
              <Radio value="full_time" />
              <Label>Full-time (€150)</Label>
              <Description>Salaried Position</Description>
            </RadioField>
            <RadioField>
              <Radio value="part_time" />
              <Label>Part-time (€100)</Label>
              <Description>
                Salaried position but less than 4 days per week
              </Description>
            </RadioField>
            <RadioField>
              <Radio value="freelancer" />
              <Label>Freelancer (€100)</Label>
              <Description>Shorter-term usually or fixed term/job</Description>
            </RadioField>
            <RadioField>
              <Radio value="other_role_type" />
              <Label>Other (€100)</Label>
              <Description>
                Looking for a co-founder or something else we haven’t thought of
              </Description>
            </RadioField>
          </RadioGroup>
        </Field>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Terms & Conditions</Subheading>
          <Text>Ah yes, the fine print.</Text>
        </div>
        <div className="space-y-2">
          <Text>
            By submitting this job listing, I acknowledge and agree to the
            following terms:
          </Text>
          <Text>
            <Strong>Content Restrictions:</Strong> My listing must not contain:{" "}
            <br />- Adult or explicit content <br />- Fraudulent or illegitimate
            work opportunities <br />- Inappropriate or offensive language
          </Text>
          <Text>
            <Strong>Accurate Classification: </Strong>I confirm that the job
            type (e.g., full-time, part-time, freelance) is correctly
            categorized.
          </Text>
          <Text>
            <Strong>Removal Policy:</Strong> I understand that my listing may be
            removed without notice if it violates any of the above conditions.
          </Text>
          <Text>
            <Strong>Refund Policy:</Strong> If my listing is removed due to a
            violation within 7 days of posting, I may be eligible for a refund,
            subject to review.
          </Text>
          <Text>
            <Strong>Compliance:</Strong> I agree to comply with all applicable
            laws and regulations regarding job postings and employment
            practices.
          </Text>
        </div>
        {/* Add error part after validation here */}
      </section>

      <Divider className="my-10" soft />

      <div className="flex justify-end">
        <Button className="rounded-md" color="pink">
          Submit and checkout
        </Button>
      </div>
    </form>
  );
}
