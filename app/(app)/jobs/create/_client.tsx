"use client";

import { Button } from "@/components/ui-components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "@/components/ui-components/checkbox";
import { Description, Label } from "@/components/ui-components/fieldset";
import { Heading } from "@/components/ui-components/heading";
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
    <div className="flex justify-center">
      <div className="flex flex-col gap-y-10 pt-6 md:w-[1000px]">
        <Heading level={1}>Post a job</Heading>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Company Logo</Strong>
            </Text>
            <Text>Square format is best</Text>
          </div>
          <div className="flex-1">
            <div className="flex flex-row gap-3">
              <Image
                src="https://s3-alpha-sig.figma.com/img/8a23/cb6a/8d462a922529d9ae7a44772fb9f64b61?Expires=1729468800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=XnJwSdtoT2ZlVsJvhBPWF3AAxyOJ5qVcunVwoDqMLar78R6wuZUJvkxS3VqeOFued9~gWF8biRwIdWhSA4NHF9Fiw5P5S-KFzs68QXDGLYVL7AhoEA2u-GYaEYep52BRmsQWceF8Bd9IDPYceJkF7MyIQCIkJFkuZ6FvXcHa319yBMk0xS4qGux2sNiBqxXOjA9gcraKuBh~mj3bEQ9l4GrqzBeHRt1s6OaBqbIJUSic984Wfizmfyjcu7NDLxJaTVsYVhe8d5p2Sv8QVCrvc0UspSGLYpsmJjybLF41zoEEkIxSb~iX905tpAo2q757TKSTDOinzLdCcUwCJ-VZ8Q__"
                width={80}
                height={80}
                alt="Company Logo"
                className="rounded-[10px]"
              />
              <div>
                {/* Need to do the file selection logic using ref as well */}
                <Button
                  color="dark/white"
                  className="mt-3 rounded-md"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <input type="file" hidden ref={fileInputRef} />
                  Change Logo
                </Button>
                <p className="mt-1 text-xs text-[#888888]">
                  JPG, GIF or PNG. 1MB max.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Company Name</Strong>
            </Text>
            <Text>This will be shown in the format you type it</Text>
          </div>
          <div className="flex-1">
            <Input placeholder="Pixel Pulse Studios" />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Job Title</Strong>
            </Text>
            <Text>The job title for the position that you are opening</Text>
          </div>
          <div className="flex-1">
            <Input placeholder="Reality Architect" />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Job Description</Strong>
            </Text>
            <Text>In markdown format</Text>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="As a Reality Architect, you'll be at the forefront of creating immersive mixed reality experiences that blur the line between the digital and physical..."
              resizable={false}
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Locations</Strong>
            </Text>
            <Text>
              Where is the job location? (“Dublin”, “Remote USA”, “Anywhere”).
            </Text>
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-4">
              <Input placeholder="Dublin (2 days in the office per week)" />
              <CheckboxGroup>
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
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Application form URL</Strong>
            </Text>
            <Text>A link to your website (optional)</Text>
          </div>
          <div className="flex-1">
            <Input />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Job Type</Strong>
            </Text>
            <Text>Full-time, part-time or freelancer</Text>
          </div>
          <div className="flex-1">
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
                <Description>
                  Shorter-term usually or fixed term/job
                </Description>
              </RadioField>
              <RadioField>
                <Radio value="other_role_type" />
                <Label>Other (€100)</Label>
                <Description>
                  Looking for a co-founder or something else we haven’t thought
                  of
                </Description>
              </RadioField>
            </RadioGroup>
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <Text>
              <Strong>Terms & Conditions</Strong>
            </Text>
            <Text>Ah yes, the fine print.</Text>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Text>
              By submitting this job listing, I acknowledge and agree to the
              following terms:
            </Text>
            <Text>
              <Strong>Content Restrictions:</Strong> My listing must not
              contain: <br />- Adult or explicit content <br />- Fraudulent or
              illegitimate work opportunities <br />- Inappropriate or offensive
              language
            </Text>
            <Text>
              <Strong>Accurate Classification: </Strong>I confirm that the job
              type (e.g., full-time, part-time, freelance) is correctly
              categorized.
            </Text>
            <Text>
              <Strong>Removal Policy:</Strong> I understand that my listing may
              be removed without notice if it violates any of the above
              conditions.
            </Text>
            <Text>
              <Strong>Refund Policy:</Strong> If my listing is removed due to a
              violation within 7 days of posting, I may be eligible for a
              refund, subject to review.
            </Text>
            <Text>
              <Strong>Compliance:</Strong> I agree to comply with all applicable
              laws and regulations regarding job postings and employment
              practices.
            </Text>
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="rounded-md" color="pink">
            Submit and checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
