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

interface TermsOfServiceProps {
  onClose?: () => void;
}

export default function TermsOfService({ onClose }: TermsOfServiceProps) {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
            These Terms of Service ("Terms") govern your use of the Freshies mobile application ("App") and related services provided by Hide and Seek Digital Pty Ltd (ACN 685 700 467), trading as "Freshies" ("we", "us", or "our"). By accessing or using our App, you agree to be bound by these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using the Freshies App, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our App.
          </Text>
          <Text style={styles.paragraph}>
            If you are under 18 years of age, you must have your parent or guardian's permission to use the App and they must agree to these Terms on your behalf.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Freshies provides a mobile application designed to help families manage skincare routines, track skin health, scan and analyze skincare products, and access educational content about skincare and ingredients. Our services include:
          </Text>
          <Text style={styles.bulletPoint}>• Product ingredient scanning and analysis</Text>
          <Text style={styles.bulletPoint}>• Personalized skincare routine creation and management</Text>
          <Text style={styles.bulletPoint}>• Progress tracking and photo documentation</Text>
          <Text style={styles.bulletPoint}>• Educational content about skincare and ingredients</Text>
          <Text style={styles.bulletPoint}>• Family account management features</Text>
          <Text style={styles.bulletPoint}>• Gamification elements including rewards and achievements</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.subheading}>3.1 Account Registration</Text>
          <Text style={styles.paragraph}>
            To access certain features of the App, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </Text>
          
          <Text style={styles.subheading}>3.2 Account Types</Text>
          <Text style={styles.paragraph}>
            We offer different account types including Parent/Guardian accounts and Child accounts. Parent/Guardian accounts have administrative control over associated Child accounts, including the ability to:
          </Text>
          <Text style={styles.bulletPoint}>• Create and manage Child accounts</Text>
          <Text style={styles.bulletPoint}>• Monitor Child account activity</Text>
          <Text style={styles.bulletPoint}>• Control privacy settings and data sharing</Text>
          <Text style={styles.bulletPoint}>• Approve or restrict certain features</Text>

          <Text style={styles.subheading}>3.3 Account Security</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Privacy and Data Protection</Text>
          <Text style={styles.paragraph}>
            Your use of our App is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the App, you consent to our collection and use of your information as described in the Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            We are committed to protecting the privacy of children. Our App complies with applicable Australian privacy laws including the Privacy Act 1988 (Cth) and the Australian Privacy Principles.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Content</Text>
          <Text style={styles.subheading}>5.1 Your Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of any content you submit to the App, including photos, routine information, and other data ("User Content"). By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your User Content solely for the purpose of providing and improving our services.
          </Text>

          <Text style={styles.subheading}>5.2 Content Standards</Text>
          <Text style={styles.paragraph}>
            You agree not to submit any User Content that:
          </Text>
          <Text style={styles.bulletPoint}>• Is unlawful, harmful, threatening, abusive, or defamatory</Text>
          <Text style={styles.bulletPoint}>• Violates any third party's rights, including privacy or intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Contains viruses or other harmful code</Text>
          <Text style={styles.bulletPoint}>• Is false, misleading, or fraudulent</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Medical Disclaimer</Text>
          <Text style={styles.paragraph}>
            THE FRESHIES APP IS NOT INTENDED TO PROVIDE MEDICAL ADVICE. The information provided through our App, including product analysis, routine suggestions, and educational content, is for informational purposes only and should not be considered as medical, dermatological, or professional healthcare advice.
          </Text>
          <Text style={styles.paragraph}>
            Always consult with a qualified healthcare professional, dermatologist, or pediatrician before making decisions about skincare, especially for children or if you have specific skin conditions or concerns. Never disregard professional medical advice or delay seeking it because of information obtained through the App.
          </Text>
          <Text style={styles.paragraph}>
            If you experience any adverse reactions to skincare products, discontinue use immediately and seek medical attention if necessary.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of the App, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of Hide and Seek Digital Pty Ltd or its licensors and are protected by Australian and international copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.paragraph}>
            The Freshies name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Hide and Seek Digital Pty Ltd. You may not use such marks without our prior written permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>• Use the App for any unlawful purpose or in violation of these Terms</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to any portion of the App or any systems or networks connected to the App</Text>
          <Text style={styles.bulletPoint}>• Use any robot, spider, or other automatic device to access the App</Text>
          <Text style={styles.bulletPoint}>• Reverse engineer, decompile, or disassemble any software used in the App</Text>
          <Text style={styles.bulletPoint}>• Remove, alter, or obscure any proprietary notices on the App</Text>
          <Text style={styles.bulletPoint}>• Impersonate any person or entity or misrepresent your affiliation with any person or entity</Text>
          <Text style={styles.bulletPoint}>• Interfere with or disrupt the App or servers or networks connected to the App</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Third-Party Services and Links</Text>
          <Text style={styles.paragraph}>
            The App may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
          </Text>
          <Text style={styles.paragraph}>
            Your use of any third-party services, including product purchases, is subject to the terms and conditions and privacy policies of those third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Disclaimers and Limitations of Liability</Text>
          <Text style={styles.subheading}>10.1 Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Text>

          <Text style={styles.subheading}>10.2 Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL HIDE AND SEEK DIGITAL PTY LTD, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE APP.
          </Text>
          <Text style={styles.paragraph}>
            Our total liability to you for any claims arising from or related to these Terms or your use of the App shall not exceed the amount you have paid us in the twelve (12) months prior to the claim arising.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to defend, indemnify, and hold harmless Hide and Seek Digital Pty Ltd, its affiliates, and their respective directors, officers, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
          </Text>
          <Text style={styles.paragraph}>
            Upon termination, your right to use the App will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive termination.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify or replace these Terms at any time at our sole discretion. If we make material changes, we will notify you through the App or by email. Your continued use of the App after any such changes constitutes your acceptance of the new Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Governing Law and Dispute Resolution</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of New South Wales, Australia, without regard to its conflict of law provisions.
          </Text>
          <Text style={styles.paragraph}>
            Any dispute arising out of or relating to these Terms or the App shall first be attempted to be resolved through good faith negotiations. If the dispute cannot be resolved through negotiation, it shall be submitted to mediation in Sydney, New South Wales, in accordance with the Australian Commercial Disputes Centre (ACDC) Mediation Guidelines.
          </Text>
          <Text style={styles.paragraph}>
            If mediation is unsuccessful, any unresolved dispute shall be resolved by binding arbitration in accordance with the ACDC Arbitration Rules. The arbitration shall be conducted in Sydney, New South Wales, and the language of the arbitration shall be English.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Consumer Rights</Text>
          <Text style={styles.paragraph}>
            Nothing in these Terms is intended to exclude, restrict, or modify any consumer rights under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) or any other applicable consumer protection laws that cannot be excluded, restricted, or modified by agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Severability</Text>
          <Text style={styles.paragraph}>
            If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Entire Agreement</Text>
          <Text style={styles.paragraph}>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Hide and Seek Digital Pty Ltd regarding the use of the App and supersede all prior and contemporaneous agreements and understandings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Hide and Seek Digital Pty Ltd{'\n'}
            Trading as: Freshies{'\n'}
            ACN: 685 700 467{'\n'}
            Email: legal@freshies.app{'\n'}
            Address: Sydney, NSW, Australia
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
