import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopFromRequest } from "@/lib/session";
import type { SizeChartHealth, SizeChartIssue } from "@/types";

interface SizeChartMeasurements {
  [size: string]: Record<string, number>;
}

interface CreateSizeChartBody {
  name: string;
  productType?: string;
  measurements: SizeChartMeasurements;
  unit?: string;
  isDefault?: boolean;
  id?: string;
}

function calculateHealthScore(measurements: SizeChartMeasurements): SizeChartHealth {
  const issues: SizeChartIssue[] = [];
  const sizes = Object.keys(measurements);

  if (sizes.length === 0) {
    return {
      score: 0,
      issues: [{ type: "incomplete_sizes", severity: "error", message: "No sizes defined" }],
      completeness: 0,
      consistency: 0,
    };
  }

  // Collect all measurement keys across all sizes
  const allMeasurementKeysSet = new Set<string>();
  for (const size of sizes) {
    for (const key of Object.keys(measurements[size])) {
      allMeasurementKeysSet.add(key);
    }
  }

  const allMeasurementKeys = Array.from(allMeasurementKeysSet);
  const totalMeasurementKeys = allMeasurementKeys.length;
  if (totalMeasurementKeys === 0) {
    return {
      score: 0,
      issues: [{ type: "missing_measurement", severity: "error", message: "No measurements defined for any size" }],
      completeness: 0,
      consistency: 0,
    };
  }

  // Check for missing measurements per size
  let totalExpected = sizes.length * totalMeasurementKeys;
  let totalPresent = 0;

  for (const size of sizes) {
    const sizeMeasurements = measurements[size];
    for (const key of allMeasurementKeys) {
      if (key in sizeMeasurements && typeof sizeMeasurements[key] === "number") {
        totalPresent++;
      } else {
        issues.push({
          type: "missing_measurement",
          severity: "warning",
          message: `Missing measurement "${key}" for size "${size}"`,
          size,
          measurement: key,
        });
      }
    }
  }

  const completeness = totalExpected > 0 ? totalPresent / totalExpected : 0;

  // Check for consistent progression across sizes
  let consistentProgressions = 0;
  let totalProgressions = 0;

  for (const key of allMeasurementKeys) {
    const values: number[] = [];
    for (const size of sizes) {
      if (key in measurements[size] && typeof measurements[size][key] === "number") {
        values.push(measurements[size][key]);
      }
    }

    if (values.length < 2) continue;

    totalProgressions++;
    let isIncreasing = true;
    let isDecreasing = true;

    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) isIncreasing = false;
      if (values[i] >= values[i - 1]) isDecreasing = false;
    }

    if (isIncreasing || isDecreasing) {
      consistentProgressions++;
    } else {
      issues.push({
        type: "inconsistent_progression",
        severity: "warning",
        message: `Measurement "${key}" does not have consistent progression across sizes`,
        measurement: key,
      });
    }
  }

  const consistency =
    totalProgressions > 0 ? consistentProgressions / totalProgressions : 1;

  // Check for outlier values
  for (const key of allMeasurementKeys) {
    const values: number[] = [];
    for (const size of sizes) {
      if (key in measurements[size] && typeof measurements[size][key] === "number") {
        values.push(measurements[size][key]);
      }
    }

    if (values.length < 3) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );

    for (let i = 0; i < values.length; i++) {
      if (stdDev > 0 && Math.abs(values[i] - mean) > 3 * stdDev) {
        issues.push({
          type: "outlier_value",
          severity: "warning",
          message: `Outlier value ${values[i]} for measurement "${key}" in size "${sizes[i]}"`,
          size: sizes[i],
          measurement: key,
        });
      }
    }
  }

  const score = Math.round((completeness * 0.5 + consistency * 0.5) * 100);

  return { score, issues, completeness, consistency };
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const shopAuth = await getShopFromRequest(request);

    if (!shopAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const sizeCharts = await prisma.sizeChart.findMany({
      where: { shopId: shop.id },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sizeCharts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch size charts: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const shopAuth = await getShopFromRequest(request);

    if (!shopAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shopAuth.shop },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const body: CreateSizeChartBody = await request.json();

    if (!body.name || !body.measurements) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, measurements" },
        { status: 400 }
      );
    }

    // Validate measurements structure
    if (typeof body.measurements !== "object" || Array.isArray(body.measurements)) {
      return NextResponse.json(
        { success: false, error: "Measurements must be an object mapping sizes to measurement objects" },
        { status: 400 }
      );
    }

    for (const [size, sizeMeasurements] of Object.entries(body.measurements)) {
      if (typeof sizeMeasurements !== "object" || Array.isArray(sizeMeasurements)) {
        return NextResponse.json(
          {
            success: false,
            error: `Measurements for size "${size}" must be an object mapping measurement names to numbers`,
          },
          { status: 400 }
        );
      }
      for (const [key, value] of Object.entries(sizeMeasurements)) {
        if (typeof value !== "number" || isNaN(value)) {
          return NextResponse.json(
            {
              success: false,
              error: `Measurement "${key}" for size "${size}" must be a number`,
            },
            { status: 400 }
          );
        }
      }
    }

    const health = calculateHealthScore(body.measurements);

    const sizeChartData = {
      name: body.name,
      productType: body.productType ?? null,
      measurements: body.measurements,
      unit: body.unit ?? "in",
      isDefault: body.isDefault ?? false,
      healthScore: health.score,
      issues: health.issues,
    };

    let sizeChart;

    if (body.id) {
      // Update existing
      const existing = await prisma.sizeChart.findFirst({
        where: { id: body.id, shopId: shop.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Size chart not found" },
          { status: 404 }
        );
      }

      sizeChart = await prisma.sizeChart.update({
        where: { id: body.id },
        data: sizeChartData,
      });
    } else {
      // Create new
      sizeChart = await prisma.sizeChart.create({
        data: {
          shopId: shop.id,
          ...sizeChartData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...sizeChart, health },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to save size chart: ${message}` },
      { status: 500 }
    );
  }
}
