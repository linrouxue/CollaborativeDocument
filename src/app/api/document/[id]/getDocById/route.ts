import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证文档 ID
    if (!params.id) {
      return NextResponse.json(
        { error: "文档 ID 不能为空" },
        { status: 400 }
      );
    }

    // 检查文档是否存在
    const doc = await prisma.t_document.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        content: true,
        create_time: true,
        update_time: true,
        title: true,
        creator_id: true
      }
    });

    if (!doc) {
      return NextResponse.json(
        { error: "文档不存在" },
        { status: 404 }
      );
    }

    // 验证文档内容
    if (!doc.content) {
      return NextResponse.json(
        { error: "文档内容为空" },
        { status: 400 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("获取文档时发生错误:", error);
    return NextResponse.json(
      { error: "获取文档失败" },
      { status: 500 }
    );
  }
}
