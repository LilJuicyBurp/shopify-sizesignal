'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Card,
  FormLayout,
  TextField,
  Button,
  Select,
  DataTable,
  BlockStack,
  InlineStack,
  Text,
} from '@shopify/polaris';

interface SizeChartData {
  id: string;
  name: string;
  measurements: Record<string, Record<string, number>>;
  unit: string;
}

interface SizeChartEditorProps {
  sizeChart?: SizeChartData;
  onSave: (data: {
    name: string;
    measurements: Record<string, Record<string, number>>;
    unit: string;
  }) => void;
  saving: boolean;
}

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_MEASUREMENTS = ['chest', 'waist', 'hip', 'length'];

function extractSizesAndMeasurements(measurements: Record<string, Record<string, number>>) {
  const sizes = Object.keys(measurements);
  const measurementSet = new Set<string>();
  for (const size of sizes) {
    for (const m of Object.keys(measurements[size])) {
      measurementSet.add(m);
    }
  }
  return {
    sizes: sizes.length > 0 ? sizes : [...DEFAULT_SIZES],
    measurements: measurementSet.size > 0 ? Array.from(measurementSet) : [...DEFAULT_MEASUREMENTS],
  };
}

export function SizeChartEditor({ sizeChart, onSave, saving }: SizeChartEditorProps) {
  const initial = sizeChart
    ? extractSizesAndMeasurements(sizeChart.measurements)
    : { sizes: [...DEFAULT_SIZES], measurements: [...DEFAULT_MEASUREMENTS] };

  const [name, setName] = useState(sizeChart?.name ?? '');
  const [unit, setUnit] = useState(sizeChart?.unit ?? 'inches');
  const [sizes, setSizes] = useState<string[]>(initial.sizes);
  const [measurementColumns, setMeasurementColumns] = useState<string[]>(initial.measurements);
  const [values, setValues] = useState<Record<string, Record<string, number>>>(() => {
    if (sizeChart?.measurements) {
      return { ...sizeChart.measurements };
    }
    const init: Record<string, Record<string, number>> = {};
    for (const size of initial.sizes) {
      init[size] = {};
      for (const m of initial.measurements) {
        init[size][m] = 0;
      }
    }
    return init;
  });

  const [newSizeInput, setNewSizeInput] = useState('');
  const [newMeasurementInput, setNewMeasurementInput] = useState('');

  const handleValueChange = useCallback(
    (size: string, measurement: string, value: string) => {
      const numericValue = parseFloat(value) || 0;
      setValues((prev) => ({
        ...prev,
        [size]: {
          ...prev[size],
          [measurement]: numericValue,
        },
      }));
    },
    [],
  );

  const addSize = useCallback(() => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed || sizes.includes(trimmed)) return;
    setSizes((prev) => [...prev, trimmed]);
    setValues((prev) => {
      const newRow: Record<string, number> = {};
      for (const m of measurementColumns) {
        newRow[m] = 0;
      }
      return { ...prev, [trimmed]: newRow };
    });
    setNewSizeInput('');
  }, [newSizeInput, sizes, measurementColumns]);

  const removeSize = useCallback(
    (size: string) => {
      setSizes((prev) => prev.filter((s) => s !== size));
      setValues((prev) => {
        const next = { ...prev };
        delete next[size];
        return next;
      });
    },
    [],
  );

  const addMeasurement = useCallback(() => {
    const trimmed = newMeasurementInput.trim().toLowerCase();
    if (!trimmed || measurementColumns.includes(trimmed)) return;
    setMeasurementColumns((prev) => [...prev, trimmed]);
    setValues((prev) => {
      const next = { ...prev };
      for (const size of Object.keys(next)) {
        next[size] = { ...next[size], [trimmed]: 0 };
      }
      return next;
    });
    setNewMeasurementInput('');
  }, [newMeasurementInput, measurementColumns]);

  const removeMeasurement = useCallback(
    (measurement: string) => {
      setMeasurementColumns((prev) => prev.filter((m) => m !== measurement));
      setValues((prev) => {
        const next = { ...prev };
        for (const size of Object.keys(next)) {
          const row = { ...next[size] };
          delete row[measurement];
          next[size] = row;
        }
        return next;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    const cleanedValues: Record<string, Record<string, number>> = {};
    for (const size of sizes) {
      cleanedValues[size] = {};
      for (const m of measurementColumns) {
        cleanedValues[size][m] = values[size]?.[m] ?? 0;
      }
    }
    onSave({ name, measurements: cleanedValues, unit });
  }, [name, sizes, measurementColumns, values, unit, onSave]);

  const tableHeadings = useMemo(
    () => [
      'Size',
      ...measurementColumns.map((m) => m.charAt(0).toUpperCase() + m.slice(1)),
      '',
    ],
    [measurementColumns],
  );

  const tableRows = useMemo(
    () =>
      sizes.map((size) => [
        size,
        ...measurementColumns.map((m) => String(values[size]?.[m] ?? 0)),
        '',
      ]),
    [sizes, measurementColumns, values],
  );

  const unitOptions = [
    { label: 'Inches', value: 'inches' },
    { label: 'Centimeters', value: 'cm' },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {sizeChart ? 'Edit Size Chart' : 'New Size Chart'}
        </Text>

        <FormLayout>
          <FormLayout.Group>
            <TextField
              label="Chart Name"
              value={name}
              onChange={setName}
              autoComplete="off"
              placeholder="e.g., Men's Tops"
            />
            <Select
              label="Unit"
              options={unitOptions}
              value={unit}
              onChange={setUnit}
            />
          </FormLayout.Group>
        </FormLayout>

        {/* Measurement Column Management */}
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Measurements
          </Text>
          <InlineStack gap="200" wrap>
            {measurementColumns.map((m) => (
              <InlineStack key={m} gap="100" blockAlign="center">
                <Badge>{m}</Badge>
                <Button
                  variant="plain"
                  tone="critical"
                  onClick={() => removeMeasurement(m)}
                  accessibilityLabel={`Remove ${m} measurement`}
                >
                  Remove
                </Button>
              </InlineStack>
            ))}
          </InlineStack>
          <InlineStack gap="200" blockAlign="end">
            <div style={{ maxWidth: '200px' }}>
              <TextField
                label="New Measurement"
                labelHidden
                value={newMeasurementInput}
                onChange={setNewMeasurementInput}
                autoComplete="off"
                placeholder="e.g., sleeve"
              />
            </div>
            <Button onClick={addMeasurement} disabled={!newMeasurementInput.trim()}>
              Add Measurement
            </Button>
          </InlineStack>
        </BlockStack>

        {/* Size Row Management */}
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Sizes
          </Text>
          <InlineStack gap="200" blockAlign="end">
            <div style={{ maxWidth: '200px' }}>
              <TextField
                label="New Size"
                labelHidden
                value={newSizeInput}
                onChange={setNewSizeInput}
                autoComplete="off"
                placeholder="e.g., 3XL"
              />
            </div>
            <Button onClick={addSize} disabled={!newSizeInput.trim()}>
              Add Size
            </Button>
          </InlineStack>
        </BlockStack>

        {/* Editable Data Table */}
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Measurements Table ({unit})
          </Text>
          <DataTable
            columnContentTypes={[
              'text',
              ...measurementColumns.map(() => 'numeric' as const),
              'text',
            ]}
            headings={tableHeadings}
            rows={tableRows}
          />

          {/* Editable inputs for each cell */}
          <BlockStack gap="300">
            {sizes.map((size) => (
              <InlineStack key={size} gap="200" blockAlign="end" wrap={false}>
                <div style={{ width: '60px', flexShrink: 0 }}>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {size}
                  </Text>
                </div>
                {measurementColumns.map((m) => (
                  <div key={`${size}-${m}`} style={{ width: '100px', flexShrink: 0 }}>
                    <TextField
                      label={`${size} ${m}`}
                      labelHidden
                      type="number"
                      value={String(values[size]?.[m] ?? 0)}
                      onChange={(val) => handleValueChange(size, m, val)}
                      autoComplete="off"
                    />
                  </div>
                ))}
                <Button
                  variant="plain"
                  tone="critical"
                  onClick={() => removeSize(size)}
                  accessibilityLabel={`Remove size ${size}`}
                >
                  Remove
                </Button>
              </InlineStack>
            ))}
          </BlockStack>
        </BlockStack>

        <InlineStack align="end">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {sizeChart ? 'Save Changes' : 'Create Size Chart'}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
