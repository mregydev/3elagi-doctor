<template>
  <div class="rich-editor-wrapper border border-[hsl(var(--border))] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-0.5 p-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
      <button
        v-for="action in toolbar"
        :key="action.label"
        type="button"
        @click="action.run()"
        :class="[
          'p-1.5 rounded text-sm font-semibold transition-colors select-none',
          action.active?.() ? 'bg-[hsl(var(--primary))] text-white' : 'hover:bg-white text-[hsl(var(--foreground))]'
        ]"
        :title="action.label"
      >
        <component :is="action.icon" :size="14" />
      </button>
    </div>
    <!-- Editor area -->
    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { watch, onBeforeUnmount } from 'vue'
import { Bold, Italic, List, ListOrdered, Heading2, Undo2, Redo2, Minus } from 'lucide-vue-next'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder ?? '' }),
  ],
  editorProps: {
    attributes: { class: 'focus:outline-none' },
  },
  onUpdate({ editor }) {
    const html = editor.getHTML()
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = editor.value.getHTML()
  if (val !== current) editor.value.commands.setContent(val || '')
})

onBeforeUnmount(() => editor.value?.destroy())

const toolbar = [
  { label: 'Bold',          icon: Bold,         run: () => editor.value?.chain().focus().toggleBold().run(),          active: () => editor.value?.isActive('bold') ?? false },
  { label: 'Italic',        icon: Italic,        run: () => editor.value?.chain().focus().toggleItalic().run(),        active: () => editor.value?.isActive('italic') ?? false },
  { label: 'Heading',       icon: Heading2,      run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.value?.isActive('heading', { level: 2 }) ?? false },
  { label: 'Bullet list',   icon: List,          run: () => editor.value?.chain().focus().toggleBulletList().run(),    active: () => editor.value?.isActive('bulletList') ?? false },
  { label: 'Ordered list',  icon: ListOrdered,   run: () => editor.value?.chain().focus().toggleOrderedList().run(),  active: () => editor.value?.isActive('orderedList') ?? false },
  { label: 'Divider',       icon: Minus,         run: () => editor.value?.chain().focus().setHorizontalRule().run(),  active: () => false },
  { label: 'Undo',          icon: Undo2,         run: () => editor.value?.chain().focus().undo().run(),               active: () => false },
  { label: 'Redo',          icon: Redo2,         run: () => editor.value?.chain().focus().redo().run(),               active: () => false },
]
</script>

<style>
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}
</style>
