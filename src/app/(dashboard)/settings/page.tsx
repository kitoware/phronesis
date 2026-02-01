"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageContainer, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrent);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const { toast } = useToast();

  const isLoading = user === undefined;

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    try {
      await updatePreferences({ theme });
      toast({
        title: "Settings updated",
        description: "Your theme preference has been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  const handleDigestFrequencyChange = async (
    frequency: "daily" | "weekly" | "monthly"
  ) => {
    try {
      await updatePreferences({
        digestFrequency: frequency,
        emailDigest: true,
      });
      toast({
        title: "Settings updated",
        description: "Your digest preferences have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your account information from Clerk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{user.name || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Sign in to view your profile.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the app looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme
                  </p>
                </div>
                <Select
                  value={user?.preferences?.theme || "system"}
                  onValueChange={(value) =>
                    handleThemeChange(value as "light" | "dark" | "system")
                  }
                  disabled={isLoading || !user}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure email digest and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive periodic summaries of new research
                  </p>
                </div>
                <Select
                  value={user?.preferences?.digestFrequency || "weekly"}
                  onValueChange={(value) =>
                    handleDigestFrequencyChange(
                      value as "daily" | "weekly" | "monthly"
                    )
                  }
                  disabled={isLoading || !user}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
