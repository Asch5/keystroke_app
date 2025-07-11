'use client';

import {
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_OPTIONS } from '@/core/domains/user/utils/settings-constants';
import {
  processProfilePicture,
  formatFileSize,
} from '@/core/lib/utils/image-utils';
import { useTranslation } from '@/core/shared/hooks/useTranslation';
import { useUserProfileUpdate } from '@/core/shared/hooks/useUserProfileUpdate';

interface ProfileSettingsFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    baseLanguageCode: string;
    targetLanguageCode: string;
    profilePictureUrl?: string | null;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageProcessingProgress, setImageProcessingProgress] =
    useState<string>('');
  const [processedFile, setProcessedFile] = useState<File | null>(null);

  const { state, formAction, isPending } = useUserProfileUpdate();

  // Cleanup URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setImageProcessingProgress('Validating image...');

    try {
      // Show initial preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Show original file size
      const originalSizeKB = Math.round(file.size / 1024);
      setImageProcessingProgress(`Original size: ${formatFileSize(file.size)}`);

      // Process the image (compress to 50KB and create square crop)
      setImageProcessingProgress('Processing image...');
      const processedImage = await processProfilePicture(file, {
        maxSizeKB: 50,
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.9,
        format: 'jpeg',
        cropToSquare: true,
      });

      // Update preview with processed image
      const processedUrl = URL.createObjectURL(processedImage);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl); // Clean up old URL
      }
      setPreviewUrl(processedUrl);
      setProcessedFile(processedImage);

      // Show success message
      const finalSizeKB = Math.round(processedImage.size / 1024);
      const compressionRatio = Math.round(
        ((file.size - processedImage.size) / file.size) * 100,
      );

      setImageProcessingProgress(
        `Processed: ${formatFileSize(processedImage.size)}`,
      );

      toast.success('Image processed successfully!', {
        description: `Size reduced by ${compressionRatio}% (${originalSizeKB}KB → ${finalSizeKB}KB)`,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process image';
      setImageProcessingProgress(`Error: ${errorMessage}`);
      toast.error('Image processing failed', {
        description: errorMessage,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Create a custom form submission handler to include processed file
  const handleSubmit = async (formData: FormData) => {
    if (processedFile) {
      // Replace the original file with the processed one
      formData.set('profilePicture', processedFile);
    }
    return formAction(formData);
  };

  const currentProfilePicture = previewUrl || user.profilePictureUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('settings.profile')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentProfilePicture ?? undefined} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={triggerFileSelect}
                disabled={isProcessingImage}
              >
                {isProcessingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Click the camera icon to change your profile picture
              </p>
              <p className="text-xs text-muted-foreground">
                Images are automatically compressed to 50KB. Supported formats:
                JPG, PNG, WebP
              </p>
            </div>

            {/* Image processing progress */}
            {isProcessingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{imageProcessingProgress}</span>
              </div>
            )}

            {/* Show processing result */}
            {!isProcessingImage && imageProcessingProgress && processedFile && (
              <div className="flex items-center gap-2 text-sm text-success-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>{imageProcessingProgress}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              name="profilePicture"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            {state.errors?.profilePicture && (
              <p className="text-sm text-destructive">
                {state.errors.profilePicture[0]}
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.fullName')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name}
                placeholder={t('settings.enterYourFullName')}
                className={state.errors?.name ? 'border-destructive' : ''}
              />
              {state.errors?.name && (
                <p className="text-sm text-destructive">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.emailAddress')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder={t('settings.enterYourEmailAddress')}
                className={state.errors?.email ? 'border-destructive' : ''}
              />
              {state.errors?.email && (
                <p className="text-sm text-destructive">
                  {state.errors.email[0]}
                </p>
              )}
            </div>
          </div>

          {/* Language Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseLanguageCode">
                {t('settings.nativeLanguage')}
              </Label>
              <Select
                name="baseLanguageCode"
                defaultValue={user.baseLanguageCode}
              >
                <SelectTrigger
                  className={
                    state.errors?.baseLanguageCode ? 'border-destructive' : ''
                  }
                >
                  <SelectValue
                    placeholder={t('settings.selectYourNativeLanguage')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({language.nativeName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.baseLanguageCode && (
                <p className="text-sm text-destructive">
                  {state.errors.baseLanguageCode[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLanguageCode">
                {t('settings.learningLanguage')}
              </Label>
              <Select
                name="targetLanguageCode"
                defaultValue={user.targetLanguageCode}
              >
                <SelectTrigger
                  className={
                    state.errors?.targetLanguageCode ? 'border-destructive' : ''
                  }
                >
                  <SelectValue
                    placeholder={t('settings.selectLanguageToLearn')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({language.nativeName})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.targetLanguageCode && (
                <p className="text-sm text-destructive">
                  {state.errors.targetLanguageCode[0]}
                </p>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {state.message && (
            <Alert
              className={
                state.success
                  ? 'border-success-border bg-success-subtle'
                  : 'border-error-border bg-error-subtle'
              }
            >
              {state.success ? (
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              ) : (
                <AlertCircle className="h-4 w-4 text-error-foreground" />
              )}
              <AlertDescription
                className={
                  state.success
                    ? 'text-success-foreground'
                    : 'text-error-foreground'
                }
              >
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || isProcessingImage}
              className="min-w-[120px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isProcessingImage ? (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                t('settings.saveChanges')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
