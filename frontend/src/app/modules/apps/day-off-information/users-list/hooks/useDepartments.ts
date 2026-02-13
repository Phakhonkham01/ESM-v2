// src/app/modules/apps/day-off/hooks/useDepartments.ts

import { useState, useEffect } from 'react'
import { departmentService, Department } from '../core/_requests'  // Relative import from core

export const useDepartments = (onlyActive: boolean = true) => {
    const [departments, setDepartments] = useState<Department[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const depts = onlyActive
                    ? await departmentService.getActiveDepartments()
                    : await departmentService.getAllDepartments()

                setDepartments(depts)
            } catch (err) {
                setError('Failed to load departments')
                console.error('Error fetching departments:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDepartments()
    }, [onlyActive])

    const departmentOptions = departments.map(dept => ({
        value: dept.id,
        label: dept.department_name
    }))

    const getDepartmentName = (id: string): string => {
        const dept = departments.find(d => d.id === id)
        return dept?.department_name || id
    }

    const refreshDepartments = async () => {
        setIsLoading(true)
        try {
            const depts = onlyActive
                ? await departmentService.getActiveDepartments()
                : await departmentService.getAllDepartments()
            setDepartments(depts)
            setError(null)
        } catch (err) {
            setError('Failed to refresh departments')
        } finally {
            setIsLoading(false)
        }
    }

    return {
        departments,
        departmentOptions,
        isLoading,
        error,
        getDepartmentName,
        refreshDepartments
    }
}