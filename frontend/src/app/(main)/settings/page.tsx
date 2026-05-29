"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [upvoteNotifs, setUpvoteNotifs] = useState(true);
  const [answerNotifs, setAnswerNotifs] = useState(true);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input defaultValue="Jane Smith" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input defaultValue="jane@university.edu" type="email" />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Choose what you get notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "New answers to my questions", checked: answerNotifs, onChange: setAnswerNotifs },
            { label: "Upvotes on my answers", checked: upvoteNotifs, onChange: setUpvoteNotifs },
            { label: "Email digest (weekly)", checked: emailNotifs, onChange: setEmailNotifs },
          ].map(({ label, checked, onChange }) => (
            <label key={label} className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm">{label}</span>
              <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Password and session management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Current password</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">New password</label>
            <Input type="password" placeholder="At least 8 characters" />
          </div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}