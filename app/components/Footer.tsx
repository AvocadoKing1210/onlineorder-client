import { Instagram, Facebook, Mail, Twitter, Youtube } from "lucide-react";
import { config } from "@/lib/config";

interface FooterProps {
  restaurantName: string;
  tagline: string;
  email: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export default function Footer({ restaurantName, tagline, email, socialLinks }: FooterProps) {
  return (
    <footer className="py-16 px-6 bg-card border-t border-card-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h3 
            className="font-display text-3xl mb-2 text-card-foreground"
            data-testid="text-footer-name"
          >
            {restaurantName}
          </h3>
          <p className="text-muted-foreground italic">{tagline}</p>
        </div>
        
        <div className="flex justify-center gap-6 mb-8">
          {socialLinks?.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-card-foreground transition-colors"
              data-testid="link-instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {socialLinks?.facebook && (
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-card-foreground transition-colors"
              data-testid="link-facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          )}
          {socialLinks?.twitter && (
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-card-foreground transition-colors"
              data-testid="link-twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          )}
          {socialLinks?.youtube && (
            <a
              href={socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-card-foreground transition-colors"
              data-testid="link-youtube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          )}
          <a
            href={`mailto:${email}`}
            className="text-muted-foreground hover:text-card-foreground transition-colors"
            data-testid="link-email"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
        
        <div className="text-center space-y-2">
          {config.footer.engagementDates && (
            <p className="text-sm text-muted-foreground">
              Limited engagement · {config.footer.engagementDates}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            © {config.footer.copyrightYear} {restaurantName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
