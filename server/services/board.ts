import { db } from "../db";
import { boardMembers, boardTerms, members, type BoardMember, type BoardTerm, type InsertBoardMember, type InsertBoardTerm } from "@shared/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";

export class BoardService {
  async listBoardMembers(tenantId: string, filters?: {
    status?: 'ACTIEF' | 'INACTIEF';
    role?: string;
    q?: string;
  }) {
    let whereConditions = [eq(boardMembers.tenantId, tenantId)];

    if (filters?.status) {
      whereConditions.push(eq(boardMembers.status, filters.status));
    }

    if (filters?.role) {
      whereConditions.push(eq(boardMembers.role, filters.role as any));
    }

    return await db.select({
      boardMember: boardMembers,
      member: members,
    })
    .from(boardMembers)
    .leftJoin(members, eq(boardMembers.memberId, members.id))
    .where(and(...whereConditions))
    .orderBy(boardMembers.orderIndex, boardMembers.role);
  }

  async getBoardMember(tenantId: string, id: string) {
    const result = await db.select({
      boardMember: boardMembers,
      member: members,
      terms: boardTerms,
    })
    .from(boardMembers)
    .leftJoin(members, eq(boardMembers.memberId, members.id))
    .leftJoin(boardTerms, eq(boardTerms.boardMemberId, boardMembers.id))
    .where(and(
      eq(boardMembers.tenantId, tenantId),
      eq(boardMembers.id, id)
    ))
    .orderBy(desc(boardTerms.start));

    if (result.length === 0) return null;

    const boardMember = result[0].boardMember;
    const member = result[0].member;
    const terms = result.map(r => r.terms).filter(Boolean);

    return {
      ...boardMember,
      member,
      terms,
    };
  }

  async createBoardMember(tenantId: string, data: InsertBoardMember) {
    const boardMember = await db.insert(boardMembers)
      .values({ ...data, tenantId })
      .returning();

    // Create initial board term
    if (boardMember[0]) {
      await db.insert(boardTerms).values({
        tenantId,
        boardMemberId: boardMember[0].id,
        role: data.role,
        start: data.termStart,
        end: data.termEnd || null,
      });
    }

    return boardMember[0];
  }

  async updateBoardMember(tenantId: string, id: string, data: Partial<InsertBoardMember>) {
    const updated = await db.update(boardMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(boardMembers.tenantId, tenantId),
        eq(boardMembers.id, id)
      ))
      .returning();

    return updated[0];
  }

  async endActiveTerm(tenantId: string, boardMemberId: string, endDate: Date, note?: string) {
    // End current active term
    await db.update(boardTerms)
      .set({ end: endDate, note })
      .where(and(
        eq(boardTerms.tenantId, tenantId),
        eq(boardTerms.boardMemberId, boardMemberId),
        isNull(boardTerms.end)
      ));

    // Set board member status to INACTIEF if no active term
    await db.update(boardMembers)
      .set({ status: 'INACTIEF', termEnd: endDate, updatedAt: new Date() })
      .where(and(
        eq(boardMembers.tenantId, tenantId),
        eq(boardMembers.id, boardMemberId)
      ));

    return true;
  }

  async reorderBoard(tenantId: string, orderData: { id: string; orderIndex: number }[]) {
    for (const item of orderData) {
      await db.update(boardMembers)
        .set({ orderIndex: item.orderIndex, updatedAt: new Date() })
        .where(and(
          eq(boardMembers.tenantId, tenantId),
          eq(boardMembers.id, item.id)
        ));
    }
    return true;
  }

  async getActiveBoardMemberByMemberId(tenantId: string, memberId: string): Promise<BoardMember | null> {
    const result = await db.select()
      .from(boardMembers)
      .where(and(
        eq(boardMembers.tenantId, tenantId),
        eq(boardMembers.memberId, memberId),
        eq(boardMembers.status, 'ACTIEF')
      ))
      .limit(1);

    return result[0] || null;
  }

  async getBoardMemberByMemberId(tenantId: string, memberId: string) {
    const result = await db.select({
      boardMember: boardMembers,
      member: members,
    })
    .from(boardMembers)
    .leftJoin(members, eq(boardMembers.memberId, members.id))
    .where(and(
      eq(boardMembers.tenantId, tenantId),
      eq(boardMembers.memberId, memberId)
    ))
    .limit(1);

    return result[0] || null;
  }
}

export const boardService = new BoardService();