'use server';

import { revalidatePath } from 'next/cache';
import * as dal from '@/lib/dal';
import { type ActionResult, Success, Failure, ValidationError } from '@/types';
import type { TechniqueRow, TechniqueInsert } from '@/types/database.types';

export async function createTechniqueAction(input: TechniqueInsert): Promise<ActionResult<TechniqueRow>> {
    try {
        if (!input.title?.trim() || !input.media_url) {
            throw new ValidationError('Tên đòn thế và file đính kèm là bắt buộc', {});
        }

        const technique = await dal.createTechnique({
            title: input.title.trim(),
            description: input.description?.trim() || null,
            media_url: input.media_url,
            media_type: input.media_type || 'image',
        });

        revalidatePath('/techniques');
        return Success(technique);
    } catch (e) {
        return Failure(e);
    }
}

export async function updateTechniqueAction(id: string, input: Partial<TechniqueInsert>): Promise<ActionResult<TechniqueRow>> {
    try {
        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title.trim();
        if (input.description !== undefined) updateData.description = input.description?.trim() || null;
        if (input.media_url !== undefined) updateData.media_url = input.media_url;
        if (input.media_type !== undefined) updateData.media_type = input.media_type;

        const technique = await dal.updateTechnique(id, updateData);
        revalidatePath('/techniques');
        return Success(technique);
    } catch (e) {
        return Failure(e);
    }
}

export async function deleteTechniqueAction(id: string): Promise<ActionResult<void>> {
    try {
        await dal.deleteTechnique(id);
        revalidatePath('/techniques');
        return Success(undefined);
    } catch (e) {
        return Failure(e);
    }
}
