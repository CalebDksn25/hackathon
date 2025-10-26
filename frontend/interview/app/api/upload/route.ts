import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

//Using fs/pdf2json => force Node runtime (NOT Edge)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  //Read session cookie from the request
  let sessionId = req.cookies.get("aii_session")?.value ?? undefined;
  const isNewSession = !sessionId;
  if (!sessionId) sessionId = randomUUID();

  const formData = await req.formData();
  const candidateIdFromForm = (formData.get("candidateId") as string) || "";
  const jobUrl = (formData.get("jobUrl") as string) || "";
  const interviewerName = (formData.get("interviewerName") as string) || "";
  const resumeFile = formData.get("resume");
  const filepondAll = formData.getAll("filepond");
  const candidateFile = (resumeFile ??
    (filepondAll && filepondAll[0])) as File | null;

  let fileName = "";
  let parsedText = "";
  const candidateId = candidateIdFromForm || uuidv4();

  if (!candidateFile || !(candidateFile instanceof File)) {
    return NextResponse.json(
      { error: "No valid file uploaded." },
      { status: 400 }
    );
  }

  // Save PDF to /tmp and parse
  fileName = uuidv4();
  const tempFilePath = `/tmp/${fileName}.pdf`;
  const fileBuffer = Buffer.from(await candidateFile.arrayBuffer());
  await fs.writeFile(tempFilePath, fileBuffer);

  const pdfParser = new (PDFParser as any)(null, 1);
  await new Promise<void>((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData: any) =>
      reject(errData?.parserError ?? "PDF parse error")
    );
    pdfParser.on("pdfParser_dataReady", () => {
      parsedText = (pdfParser as any).getRawTextContent();
      resolve();
    });
    pdfParser.loadPDF(tempFilePath);
  });

  try {
    const rows = {
      content: parsedText,
      session_id: sessionId,
      jobUrl: jobUrl,
      interviewerName: interviewerName,
    };

    const supa = supabaseAdmin();
    const { error } = await supa.from("documents").insert(rows);
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Embedding/DB error:", e);
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }

  // Build response and set cookie if it's a new session
  const res = NextResponse.json({
    parsedText,
    fileName,
    sessionId,
  });
  if (isNewSession) {
    res.cookies.set("aii_session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5, // 5 Minutes
    });
  }
  return res;
}
