import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

interface PrivacyPolicyProps {
  onClose?: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  const router = useRouter();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <X size={24} color={colors.charcoal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: November 28, 2024</Text>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Hide and Seek Digital Pty Ltd (ACN 685 700 467), trading as "Freshies" ("we", "us", or "our"), is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Freshies mobile application ("App").
          </Text>
          <Text style={styles.paragraph}>
            We comply with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs), as well as other applicable privacy laws and regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          
          <Text style={styles.subheading}>1.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            We collect personal information that you provide directly to us, including:
          </Text>
          <Text style={styles.bulletPoint}>• Account Information: Name, email address, password, date of birth</Text>
          <Text style={styles.bulletPoint}>• Profile Information: Skin type, skin concerns, allergies, sensitivities</Text>
          <Text style={styles.bulletPoint}>• Family Information: Details about family members (with consent)</Text>
          <Text style={styles.bulletPoint}>• Contact Information: For customer support purposes</Text>

          <Text style={styles.subheading}>1.2 Health Information</Text>
          <Text style={styles.paragraph}>
            As our App deals with skincare and may collect information about skin conditions, allergies, and sensitivities, we may collect health information. This is considered sensitive information under Australian privacy law and is handled with extra care.
          </Text>

          <Text style={styles.subheading}>1.3 User-Generated Content</Text>
          <Text style={styles.paragraph}>
            We collect content you create or upload, including:
          </Text>
          <Text style={styles.bulletPoint}>• Photos: Skin progress photos (Freshies)</Text>
          <Text style={styles.bulletPoint}>• Routine Information: Custom skincare routines and preferences</Text>
          <Text style={styles.bulletPoint}>• Product Scans: Information from scanned products</Text>
          <Text style={styles.bulletPoint}>• Notes and Comments: About products or routines</Text>

          <Text style={styles.subheading}>1.4 Automatically Collected Information</Text>
          <Text style={styles.paragraph}>
            When you use our App, we automatically collect certain information, including:
          </Text>
          <Text style={styles.bulletPoint}>• Device Information: Device type, operating system, unique device identifiers</Text>
          <Text style={styles.bulletPoint}>• Usage Data: App features used, time spent, interaction patterns</Text>
          <Text style={styles.bulletPoint}>• Performance Data: Crash reports, performance metrics</Text>
          <Text style={styles.bulletPoint}>• Location Data: Only if you grant permission (for localized content)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide and maintain our services</Text>
          <Text style={styles.bulletPoint}>• Create and manage your account</Text>
          <Text style={styles.bulletPoint}>• Personalize your experience and provide tailored recommendations</Text>
          <Text style={styles.bulletPoint}>• Process and analyze product scans</Text>
          <Text style={styles.bulletPoint}>• Track progress and maintain routine history</Text>
          <Text style={styles.bulletPoint}>• Send notifications about routines and app features</Text>
          <Text style={styles.bulletPoint}>• Provide customer support</Text>
          <Text style={styles.bulletPoint}>• Improve our App and develop new features</Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
          <Text style={styles.bulletPoint}>• Protect against fraudulent or illegal activity</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
          
          <Text style={styles.subheading}>3.1 We Do Not Sell Your Information</Text>
          <Text style={styles.paragraph}>
            We do not sell, rent, or trade your personal information to third parties for their commercial purposes.
          </Text>

          <Text style={styles.subheading}>3.2 Service Providers</Text>
          <Text style={styles.paragraph}>
            We may share your information with third-party service providers who perform services on our behalf, including:
          </Text>
          <Text style={styles.bulletPoint}>• Cloud storage providers (data hosting)</Text>
          <Text style={styles.bulletPoint}>• Analytics providers (app performance)</Text>
          <Text style={styles.bulletPoint}>• Customer support tools</Text>
          <Text style={styles.bulletPoint}>• Payment processors (if applicable)</Text>
          <Text style={styles.paragraph}>
            These providers are contractually obligated to protect your information and use it only for the purposes we specify.
          </Text>

          <Text style={styles.subheading}>3.3 Legal Requirements</Text>
          <Text style={styles.paragraph}>
            We may disclose your information if required to do so by law or in response to valid requests by public authorities, including:
          </Text>
          <Text style={styles.bulletPoint}>• Court orders or legal processes</Text>
          <Text style={styles.bulletPoint}>• Government or regulatory requests</Text>
          <Text style={styles.bulletPoint}>• To protect our rights, privacy, safety, or property</Text>
          <Text style={styles.bulletPoint}>• To protect the public or other users</Text>

          <Text style={styles.subheading}>3.4 Business Transfers</Text>
          <Text style={styles.paragraph}>
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.
          </Text>

          <Text style={styles.subheading}>3.5 Family Sharing</Text>
          <Text style={styles.paragraph}>
            Within family accounts, certain information may be shared between parent and child accounts as configured by the parent/guardian. Parents have control over what information is shared.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            We take special care to protect the privacy of children who use our App. Our practices regarding children include:
          </Text>

          <Text style={styles.subheading}>4.1 Parental Consent</Text>
          <Text style={styles.paragraph}>
            For users under 13 years of age, we require verifiable parental consent before collecting personal information. Parents/guardians must create and manage accounts for children under 13.
          </Text>

          <Text style={styles.subheading}>4.2 Parental Controls</Text>
          <Text style={styles.paragraph}>
            Parents/guardians have the ability to:
          </Text>
          <Text style={styles.bulletPoint}>• Review information collected from their children</Text>
          <Text style={styles.bulletPoint}>• Request deletion of their children's information</Text>
          <Text style={styles.bulletPoint}>• Refuse further collection or use of their children's information</Text>
          <Text style={styles.bulletPoint}>• Control privacy settings for child accounts</Text>

          <Text style={styles.subheading}>4.3 Limited Collection</Text>
          <Text style={styles.paragraph}>
            We limit our collection of information from children to what is necessary to provide our services. We do not condition a child's participation on the disclosure of more personal information than is reasonably necessary.
          </Text>

          <Text style={styles.subheading}>4.4 No Targeted Advertising</Text>
          <Text style={styles.paragraph}>
            We do not display targeted advertising to children or use their information for behavioral advertising purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
          <Text style={styles.bulletPoint}>• Secure servers and databases</Text>
          <Text style={styles.bulletPoint}>• Regular security assessments and updates</Text>
          <Text style={styles.bulletPoint}>• Access controls and authentication measures</Text>
          <Text style={styles.bulletPoint}>• Employee training on data protection</Text>
          <Text style={styles.bulletPoint}>• Incident response procedures</Text>
          
          <Text style={styles.paragraph}>
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal information for as long as necessary to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide our services to you</Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
          <Text style={styles.bulletPoint}>• Resolve disputes and enforce agreements</Text>
          <Text style={styles.bulletPoint}>• Maintain business records</Text>
          
          <Text style={styles.paragraph}>
            When your information is no longer required, we will securely delete or anonymize it. You may request deletion of your account and associated data at any time, subject to legal retention requirements.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            Under Australian privacy law, you have certain rights regarding your personal information:
          </Text>

          <Text style={styles.subheading}>7.1 Access and Correction</Text>
          <Text style={styles.paragraph}>
            You have the right to access and correct your personal information. You can view and update most of your information through your account settings.
          </Text>

          <Text style={styles.subheading}>7.2 Data Portability</Text>
          <Text style={styles.paragraph}>
            You can request a copy of your personal information in a structured, commonly used, and machine-readable format.
          </Text>

          <Text style={styles.subheading}>7.3 Deletion</Text>
          <Text style={styles.paragraph}>
            You can request deletion of your personal information, subject to certain exceptions such as legal obligations or legitimate business purposes.
          </Text>

          <Text style={styles.subheading}>7.4 Opt-Out</Text>
          <Text style={styles.paragraph}>
            You can opt-out of:
          </Text>
          <Text style={styles.bulletPoint}>• Marketing communications</Text>
          <Text style={styles.bulletPoint}>• Push notifications (through device settings)</Text>
          <Text style={styles.bulletPoint}>• Location tracking (through device settings)</Text>
          <Text style={styles.bulletPoint}>• Analytics collection</Text>

          <Text style={styles.subheading}>7.5 Complaints</Text>
          <Text style={styles.paragraph}>
            If you have concerns about how we handle your personal information, you can lodge a complaint with us directly. If you're not satisfied with our response, you can complain to the Office of the Australian Information Commissioner (OAIC).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your information may be transferred to and processed in countries other than Australia. When we transfer information internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
          </Text>
          <Text style={styles.paragraph}>
            We may use service providers located in countries including the United States, which may have different data protection laws than Australia. We ensure these providers are bound by confidentiality and implement appropriate security measures.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Third-Party Links and Services</Text>
          <Text style={styles.paragraph}>
            Our App may contain links to third-party websites, products, or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information to them.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Cookies and Tracking Technologies</Text>
          <Text style={styles.paragraph}>
            We use cookies and similar tracking technologies to:
          </Text>
          <Text style={styles.bulletPoint}>• Maintain your session and preferences</Text>
          <Text style={styles.bulletPoint}>• Analyze app usage and performance</Text>
          <Text style={styles.bulletPoint}>• Provide personalized features</Text>
          <Text style={styles.bulletPoint}>• Prevent fraud and enhance security</Text>
          
          <Text style={styles.paragraph}>
            You can control cookies through your device settings, but disabling them may limit some App functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
          </Text>
          <Text style={styles.bulletPoint}>• Posting the new Privacy Policy in the App</Text>
          <Text style={styles.bulletPoint}>• Updating the "Last Updated" date</Text>
          <Text style={styles.bulletPoint}>• Sending you a notification (for material changes)</Text>
          
          <Text style={styles.paragraph}>
            Your continued use of the App after changes indicates your acceptance of the updated Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Data Breach Notification</Text>
          <Text style={styles.paragraph}>
            In the event of a data breach that is likely to result in serious harm to you, we will notify you and the Office of the Australian Information Commissioner as required under the Notifiable Data Breaches scheme.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Marketing and Communications</Text>
          <Text style={styles.paragraph}>
            With your consent, we may send you marketing communications about our products, services, and promotions. You can opt-out of marketing communications at any time by:
          </Text>
          <Text style={styles.bulletPoint}>• Clicking the unsubscribe link in emails</Text>
          <Text style={styles.bulletPoint}>• Updating your preferences in account settings</Text>
          <Text style={styles.bulletPoint}>• Contacting us directly</Text>
          
          <Text style={styles.paragraph}>
            Even if you opt-out of marketing, we may still send you transactional or service-related communications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Anonymized and Aggregated Data</Text>
          <Text style={styles.paragraph}>
            We may create anonymized and aggregated data from your personal information by removing identifying characteristics. This data is not personal information and we may use it for any lawful purpose, including research, analysis, and improving our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Hide and Seek Digital Pty Ltd{'\n'}
            Trading as: Freshies{'\n'}
            ACN: 685 700 467{'\n'}
            Email: privacy@freshies.app{'\n'}
            Address: Sydney, NSW, Australia{'\n'}
            {'\n'}
            Privacy Officer{'\n'}
            Email: privacy.officer@freshies.app
          </Text>
          
          <Text style={styles.paragraph}>
            For complaints that cannot be resolved directly with us, you may contact:
          </Text>
          <Text style={styles.contactInfo}>
            Office of the Australian Information Commissioner{'\n'}
            Phone: 1300 363 992{'\n'}
            Email: enquiries@oaic.gov.au{'\n'}
            Website: www.oaic.gov.au
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Accessibility</Text>
          <Text style={styles.paragraph}>
            We are committed to ensuring our Privacy Policy is accessible to all users. If you require this policy in an alternative format, please contact us.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleClose}
          >
            <Text style={styles.acceptButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  closeButton: {
    position: 'absolute',
    right: spacing[4],
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing[4],
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: spacing[3],
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginLeft: spacing[4],
    marginBottom: spacing[1],
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  footer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  acceptButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
