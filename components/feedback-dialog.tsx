"use client";

import { ExternalLink, MessageCircleQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { FEEDBACK_ACCOUNT, FEEDBACK_PROFILE_URL } from "@/lib/feedback-contact";

export function FeedbackDialog({ className }: { className?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-11 w-11 touch-manipulation text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
            className
          )}
          aria-label="不具合・改善要望の連絡先"
        >
          <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>不具合・改善要望</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <span className="block">
              不具合のご報告や改善要望は、Xの
              <span className="mx-1 font-semibold text-foreground">
                {FEEDBACK_ACCOUNT}
              </span>
              までお寄せください。
            </span>
            <span className="block text-xs">
              公開投稿には、個人情報や共有したくない試合データを含めないようご注意ください。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">閉じる</AlertDialogCancel>
          <AlertDialogAction asChild className="min-h-11">
            <a
              href={FEEDBACK_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xプロフィールを開く
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
