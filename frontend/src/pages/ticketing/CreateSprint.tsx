import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useId, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "../../components/ui/button"
import { FormInput } from "../../components/form/formInput"
import { DatePicker } from "../../components/ui/datePicker"
import { Drawer } from "../../components/ui/sidebar"
import { useCreateSprint } from "../../hooks/sprints/useCreateSprint"

const sprintFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date(),
  endDate: z.date(),
  projectId: z.number().min(1, "Project ID is required"),
})

type SprintFormValues = z.infer<typeof sprintFormSchema>

function CreateSprintFields({ projectName }: { projectName: string }) {
  const { control } = useFormContext<SprintFormValues>()

  return (
    <>
      <FormInput name="name" control={control} label="Name" placeholder="Name" />
      <FormInput name="description" control={control} label="Description" placeholder="Description" />

      <Controller
        name="startDate"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Start date</span>
            <DatePicker value={field.value} onChange={field.onChange} placeholder="Start date" />
            {fieldState.error && (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="endDate"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">End date</span>
            <DatePicker value={field.value} onChange={field.onChange} placeholder="End date" />
            {fieldState.error && (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Project</span>
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          {projectName}
        </p>
      </div>
    </>
  )
}

function formatDateForApi(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function AddSprint({
  projectId,
  projectName,
  onSprintCreated,
  triggerVariant = "toolbar",
}: {
  projectId: number
  projectName: string
  onSprintCreated?: (sprintId: number) => void
  triggerVariant?: "toolbar" | "sidebar"
}) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutateAsync: createSprint } = useCreateSprint()

  const methods = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      projectId,
    },
  })

  useEffect(() => {
    methods.setValue("projectId", projectId, { shouldValidate: true, shouldDirty: false })
  }, [projectId, methods])

  const handleSubmit = async (data: SprintFormValues) => {
    try {
      const created = await createSprint({
        name: data.name,
        description: data.description,
        start_date: formatDateForApi(data.startDate),
        end_date: formatDateForApi(data.endDate),
        project_id: projectId,
      })
      await queryClient.invalidateQueries({ queryKey: ["sprints"] })
      const id = created?.id as number | undefined
      if (id != null) onSprintCreated?.(id)
      setOpen(false)
      methods.reset({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        projectId,
      })
    } catch (e) {
      console.error("Could not create sprint:", e)
    }
  }

  return (
    <>
      {triggerVariant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          + Add sprint
        </button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          Create Sprint
        </Button>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} ariaLabel="Create sprint">
        <div className="flex h-full flex-col pt-12">
          <div className="border-b border-gray-200 px-4 pb-4 pr-12 pt-1">
            <p className="text-xs text-gray-500">Sprint</p>
            <h2 className="text-lg font-semibold text-gray-900">Create sprint</h2>
            <p className="mt-0.5 text-sm text-gray-600">{projectName}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FormProvider {...methods}>
              <form
                id={formId}
                className="flex flex-col gap-4"
                onSubmit={methods.handleSubmit(handleSubmit)}
              >
                <CreateSprintFields projectName={projectName} />
              </form>
            </FormProvider>
          </div>

          <div className="border-t border-gray-200 p-4">
            <Button
              type="submit"
              form={formId}
              variant="primary"
              className="w-full"
            >
              Create sprint
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}
