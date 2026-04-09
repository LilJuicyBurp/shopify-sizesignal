'use client';

import {
  Card,
  Text,
  BlockStack,
} from '@shopify/polaris';

interface WidgetConfig {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  position: string;
  showConfidence: boolean;
  showFitPrediction: boolean;
  showModelNotes: boolean;
  headingText: string;
  buttonText: string;
}

interface WidgetPreviewProps {
  config: WidgetConfig;
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Widget Preview
        </Text>

        {/* Phone frame container */}
        <div
          style={{
            maxWidth: '375px',
            margin: '0 auto',
            border: '3px solid #333',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}
        >
          {/* Phone notch */}
          <div
            style={{
              height: '24px',
              backgroundColor: '#333',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingBottom: '2px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '6px',
                backgroundColor: '#555',
                borderRadius: '3px',
              }}
            />
          </div>

          {/* Mock product page area */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              minHeight: '120px',
            }}
          >
            <div
              style={{
                height: '16px',
                width: '60%',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '40%',
                backgroundColor: '#e8e8e8',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '80%',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '70%',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Widget */}
          <div
            style={{
              margin: '0 16px 16px',
              backgroundColor: config.backgroundColor,
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${config.primaryColor}20`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Widget heading */}
            <div
              style={{
                color: config.textColor,
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              {config.headingText}
            </div>

            {/* CTA Button */}
            <button
              type="button"
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: config.primaryColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              {config.buttonText}
            </button>

            {/* Mock result section */}
            <div
              style={{
                borderTop: `1px solid ${config.textColor}15`,
                paddingTop: '16px',
              }}
            >
              {/* Recommended size */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: config.primaryColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                  }}
                >
                  M
                </div>
                <div>
                  <div
                    style={{
                      color: config.textColor,
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Recommended Size
                  </div>
                  {config.showConfidence && (
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        backgroundColor: '#4caf5020',
                        color: '#2e7d32',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      87% confidence
                    </div>
                  )}
                </div>
              </div>

              {/* Fit prediction */}
              {config.showFitPrediction && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '8px 12px',
                    backgroundColor: `${config.primaryColor}10`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      color: config.textColor,
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    True to Size
                  </span>
                </div>
              )}

              {/* Model notes */}
              {config.showModelNotes && (
                <div
                  style={{
                    color: `${config.textColor}99`,
                    fontSize: '12px',
                    lineHeight: '1.5',
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  Based on your measurements, size M provides the best fit. This
                  product runs true to size with a regular fit through the body.
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              height: '20px',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: '4px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '4px',
                backgroundColor: '#ccc',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        <Text as="p" variant="bodySm" tone="subdued" alignment="center">
          Preview of the size recommendation widget as it will appear on your
          storefront. Position: {config.position}.
        </Text>
      </BlockStack>
    </Card>
  );
}
