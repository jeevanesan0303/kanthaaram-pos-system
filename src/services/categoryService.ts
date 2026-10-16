import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface CategoryDatabaseRow {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateInput {
  name: string;
  description: string;
  image: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
  image?: string;
}

const mapCategoryFromDatabase = (
  row: CategoryDatabaseRow
): Category => {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    image: row.image || '',
    productsCount: 0,
    status: 'Active',
    createdAt: row.created_at.slice(0, 10),
    updatedAt: row.updated_at
  };
};

const getErrorMessage = (
  defaultMessage: string,
  errorMessage: string
): string => {
  if (
    errorMessage.includes(
      'duplicate key value violates unique constraint'
    )
  ) {
    return 'A category with this name already exists.';
  }

  if (
    errorMessage.includes('row-level security') ||
    errorMessage.includes('permission denied')
  ) {
    return 'You do not have permission to perform this action.';
  }

  if (
    errorMessage.includes(
      'violates foreign key constraint'
    )
  ) {
    return (
      'This category is still connected to another record. ' +
      'Delete or update the connected records first.'
    );
  }

  return `${defaultMessage}: ${errorMessage}`;
};

export const categoryService = {
  // READ all categories
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('category')
      .select(`
        id,
        name,
        description,
        image,
        created_at,
        updated_at
      `)
      .order('name', {
        ascending: true
      });

    if (error) {
      throw new Error(
        getErrorMessage(
          'Unable to load categories',
          error.message
        )
      );
    }

    return (
      (data || []) as CategoryDatabaseRow[]
    ).map(mapCategoryFromDatabase);
  },

  // READ one category
  async getById(
    id: string
  ): Promise<Category> {
    if (!id) {
      throw new Error('Category ID is required.');
    }

    const { data, error } = await supabase
      .from('category')
      .select(`
        id,
        name,
        description,
        image,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          'Unable to load category',
          error.message
        )
      );
    }

    return mapCategoryFromDatabase(
      data as CategoryDatabaseRow
    );
  },

  // CREATE category
  async create(
    input: CategoryCreateInput
  ): Promise<Category> {
    const cleanName = input.name.trim();

    if (cleanName.length < 2) {
      throw new Error(
        'Category name must contain at least 2 characters.'
      );
    }

    const { data, error } = await supabase
      .from('category')
      .insert({
        name: cleanName,
        description:
          input.description.trim() || null,
        image:
          input.image.trim() || null
      })
      .select(`
        id,
        name,
        description,
        image,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          'Unable to create category',
          error.message
        )
      );
    }

    return mapCategoryFromDatabase(
      data as CategoryDatabaseRow
    );
  },

  // UPDATE category
  async update(
    id: string,
    input: CategoryUpdateInput
  ): Promise<Category> {
    if (!id) {
      throw new Error('Category ID is required.');
    }

    const updateData: {
      name?: string;
      description?: string | null;
      image?: string | null;
    } = {};

    if (input.name !== undefined) {
      const cleanName = input.name.trim();

      if (cleanName.length < 2) {
        throw new Error(
          'Category name must contain at least 2 characters.'
        );
      }

      updateData.name = cleanName;
    }

    if (input.description !== undefined) {
      updateData.description =
        input.description.trim() || null;
    }

    if (input.image !== undefined) {
      updateData.image =
        input.image.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        'No category changes were provided.'
      );
    }

    const { data, error } = await supabase
      .from('category')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        image,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          'Unable to update category',
          error.message
        )
      );
    }

    return mapCategoryFromDatabase(
      data as CategoryDatabaseRow
    );
  },

  // DELETE selected category and only its products
  async remove(
    categoryId: string
  ): Promise<void> {
    if (!categoryId) {
      throw new Error('Category ID is required.');
    }

    /*
     * Delete only products connected to the selected
     * category. Products from other categories remain.
     */
    const { error: productDeleteError } =
      await supabase
        .from('products')
        .delete()
        .eq('category_id', categoryId);

    if (productDeleteError) {
      throw new Error(
        getErrorMessage(
          'Unable to delete products in this category',
          productDeleteError.message
        )
      );
    }

    // Delete only the selected category
    const {
      data: deletedCategory,
      error: categoryDeleteError
    } = await supabase
      .from('category')
      .delete()
      .eq('id', categoryId)
      .select('id')
      .maybeSingle();

    if (categoryDeleteError) {
      throw new Error(
        getErrorMessage(
          'Unable to delete category',
          categoryDeleteError.message
        )
      );
    }

    if (!deletedCategory) {
      throw new Error(
        'Category was not deleted. Check your Supabase delete permission.'
      );
    }
  }
};